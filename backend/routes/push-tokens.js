const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/register', async (req, res) => {
  try {
    const { device_id, expo_push_token, fcm_token, user_type, tenant_id } = req.body;

    if (!device_id || !user_type) {
      return res.status(400).json({ 
        error: 'device_id e user_type são obrigatórios' 
      });
    }

    if (!expo_push_token && !fcm_token) {
      return res.status(400).json({ 
        error: 'expo_push_token ou fcm_token é obrigatório' 
      });
    }

    if (!['client', 'owner'].includes(user_type)) {
      return res.status(400).json({ 
        error: 'user_type deve ser "client" ou "owner"' 
      });
    }

    const result = await pool.query(
      `INSERT INTO push_tokens (device_id, expo_push_token, fcm_token, tenant_id, user_type, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (device_id) 
       DO UPDATE SET 
         expo_push_token = COALESCE(EXCLUDED.expo_push_token, push_tokens.expo_push_token),
         fcm_token = COALESCE(EXCLUDED.fcm_token, push_tokens.fcm_token),
         tenant_id = EXCLUDED.tenant_id,
         user_type = EXCLUDED.user_type,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [device_id, expo_push_token, fcm_token, tenant_id, user_type]
    );

    console.log(`✅ Push token registrado - Device: ${device_id}, FCM: ${fcm_token ? 'Sim' : 'Não'}, Expo: ${expo_push_token ? 'Sim' : 'Não'}`);

    res.status(200).json({
      success: true,
      message: 'Push token registrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao registrar push token:', error);
    res.status(500).json({ error: 'Erro ao registrar push token' });
  }
});

router.delete('/unregister/:device_id', async (req, res) => {
  try {
    const { device_id } = req.params;

    const result = await pool.query(
      'DELETE FROM push_tokens WHERE device_id = $1 RETURNING *',
      [device_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Push token não encontrado' });
    }

    res.json({
      success: true,
      message: 'Push token removido com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao remover push token:', error);
    res.status(500).json({ error: 'Erro ao remover push token' });
  }
});

module.exports = router;
