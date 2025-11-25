const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { validateTenant } = require('../middleware/tenant');
const { checkProviderLimit } = require('../middleware/planLimits');

const router = express.Router();

router.use(validateTenant);

function generateCanonicalId() {
  return "cdev_" + crypto.randomUUID();
}

router.post('/', async (req, res, next) => {
  try {
    const { device_id, device_name, fcm_token, is_owner } = req.body;

    // Check provider limit only if creating as owner
    if (is_owner) {
      return checkProviderLimit(req, res, async () => {
        return createDevice(req, res);
      });
    }

    return createDevice(req, res);
  } catch (error) {
    console.error('Erro ao registrar dispositivo:', error);
    res.status(500).json({ error: 'Erro ao registrar dispositivo' });
  }
});

async function createDevice(req, res) {
  try {
    const { device_id, device_name, fcm_token, is_owner } = req.body;

    const client = await pool.connect();

    // 1. Buscar dispositivo existente
    const result = await client.query(
      `SELECT * FROM devices WHERE local_device_id = $1 AND tenant_id = $2`,
      [device_id, req.tenant.id]
    );

    let status = "new";

    if (result.rows.length === 0) {
      // Criar novo device
      const canonicalId = generateCanonicalId();

      await client.query(
        `INSERT INTO devices
        (canonical_device_id, local_device_id, tenant_id, name, fcm_token, brand, model_name, os_name, os_version, manufacturer, device_type, app_version, build_number)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          canonicalId,
          device_id,
          req.tenant.id,
          device_name,
          fcm_token,
          req.fingerprint.brand,
          req.fingerprint.modelName,
          req.fingerprint.osName,
          req.fingerprint.osVersion,
          req.fingerprint.manufacturer,
          req.fingerprint.deviceType,
          req.fingerprint.appVersion,
          req.fingerprint.buildNumber,
        ]
      );

      client.release();

      return res.json({
        status: "created",
        deviceId: canonicalId,
      });
    }

    // Já existe
    const device = result.rows[0];
    status = "restored";

    // Detectar mudança suspeita
    const suspicious =
      device.brand !== req.fingerprint.brand ||
      device.model_name !== req.fingerprint.modelName ||
      device.os_name !== req.fingerprint.osName ||
      device.os_version !== req.fingerprint.osVersion ||
      device.manufacturer !== req.fingerprint.manufacturer;

    if (suspicious) status = "suspicious";

    // Atualizar last_seen + fingerprint
    await client.query(
      `UPDATE devices SET
        name=$1, fcm_token=$2, brand=$3, model_name=$4, os_name=$5, os_version=$6,
        manufacturer=$7, device_type=$8, app_version=$9, build_number=$10,
        last_seen_at = NOW()
      WHERE id = $11`,
      [
        device_name,
        fcm_token,
        req.fingerprint.brand,
        req.fingerprint.modelName,
        req.fingerprint.osName,
        req.fingerprint.osVersion,
        req.fingerprint.manufacturer,
        req.fingerprint.deviceType,
        req.fingerprint.appVersion,
        req.fingerprint.buildNumber,
        device.id,
      ]
    );

    client.release();

    return res.json({
      status,
      deviceId: device.canonical_device_id,
    });
  } catch (error) {
    console.error('Erro ao criar dispositivo:', error);
    res.status(500).json({ error: 'Erro ao criar dispositivo' });
  }
}

router.post("/register-or-resolve", async (req, res) => {
  try {
    const { localDeviceId, tenantId, fingerprint } = req.body;

    if (!localDeviceId || !tenantId || !fingerprint) {
      return res.status(400).json({
        error: "Missing fields: localDeviceId, tenantId, fingerprint",
      });
    }

    const client = await pool.connect();

    // 1. Buscar dispositivo existente
    const result = await client.query(
      `SELECT * FROM devices WHERE local_device_id = $1 AND tenant_id = $2`,
      [localDeviceId, tenantId]
    );

    let status = "new";

    if (result.rows.length === 0) {
      // Criar novo device
      const canonicalId = generateCanonicalId();

      await client.query(
        `INSERT INTO devices
        (canonical_device_id, local_device_id, tenant_id, brand, model_name, os_name, os_version, manufacturer, device_type, app_version, build_number)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          canonicalId,
          localDeviceId,
          tenantId,
          fingerprint.brand,
          fingerprint.modelName,
          fingerprint.osName,
          fingerprint.osVersion,
          fingerprint.manufacturer,
          fingerprint.deviceType,
          fingerprint.appVersion,
          fingerprint.buildNumber,
        ]
      );

      client.release();

      return res.json({
        status: "created",
        deviceId: canonicalId,
      });
    }

    // Já existe
    const device = result.rows[0];
    status = "restored";

    // Detectar mudança suspeita
    const suspicious =
      device.brand !== fingerprint.brand ||
      device.model_name !== fingerprint.modelName ||
      device.os_name !== fingerprint.osName ||
      device.os_version !== fingerprint.osVersion ||
      device.manufacturer !== fingerprint.manufacturer;

    if (suspicious) status = "suspicious";

    // Atualizar last_seen + fingerprint
    await client.query(
      `UPDATE devices SET
        brand=$1, model_name=$2, os_name=$3, os_version=$4,
        manufacturer=$5, device_type=$6, app_version=$7, build_number=$8,
        last_seen_at = NOW()
      WHERE id = $9`,
      [
        fingerprint.brand,
        fingerprint.modelName,
        fingerprint.osName,
        fingerprint.osVersion,
        fingerprint.manufacturer,
        fingerprint.deviceType,
        fingerprint.appVersion,
        fingerprint.buildNumber,
        device.id,
      ]
    );

    client.release();

    return res.json({
      status,
      deviceId: device.canonical_device_id,
    });
  } catch (error) {
    console.error("Device register error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router