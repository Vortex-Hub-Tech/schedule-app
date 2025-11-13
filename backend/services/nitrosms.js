
const axios = require('axios');
const { pool, vortexPool } = require('../db');

const NITROSMS_API_URL = 'https://nitrosms.growsoft.io/services/send.php';

class NitroSMSService {
  getGlobalCredentials() {
    const apiKey = process.env.NITRO_API_KEY;

    if (!apiKey) {
      throw new Error('Credenciais globais NitroSMS não configuradas. Configure NITRO_API_KEY');
    }

    return {
      apiKey
    };
  }

  async getTenantDeviceId(tenantId) {
    try {
      const result = await vortexPool.query(
        `SELECT nitro_device_id 
         FROM integrations 
         WHERE tenant_id = $1 
         AND type = 'sms' 
         AND is_active = true
         LIMIT 1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Configuração de device_id não encontrada para este tenant');
      }

      const deviceId = result.rows[0].nitro_device_id;
      
      if (!deviceId) {
        throw new Error('Device ID não configurado para este tenant');
      }

      return deviceId;
    } catch (error) {
      console.error('❌ Erro ao buscar device_id do tenant:', error.message);
      throw error;
    }
  }

  async sendSMS(tenantId, phone, message, schedule = null, prioritize = false) {
    let logId = null;
    
    try {
      const credentials = this.getGlobalCredentials();
      const deviceId = await this.getTenantDeviceId(tenantId);

      const logResult = await pool.query(
        `INSERT INTO sms_logs (tenant_id, phone, message, sender_id, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tenantId, phone, message, deviceId, 'sending']
      );
      logId = logResult.rows[0].id;

      const cleanPhone = phone.replace(/\D/g, '');

      const postData = {
        key: credentials.apiKey,
        number: cleanPhone,
        message: message,
        devices: deviceId,
        type: 'sms',
        schedule: schedule,
        prioritize: prioritize ? 1 : 0
      };

      const response = await axios.post(NITROSMS_API_URL, postData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      await pool.query(
        `UPDATE sms_logs 
         SET status = $1, nitro_response = $2, sent_at = NOW()
         WHERE id = $3`,
        ['sent', JSON.stringify(response.data), logId]
      );

      console.log(`✅ SMS enviado para ${phone} via NitroSMS (Device: ${deviceId}, Log ID: ${logId})`);
      
      return {
        success: true,
        logId: logId,
        response: response.data
      };

    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      
      if (logId) {
        await pool.query(
          `UPDATE sms_logs 
           SET status = $1, error_message = $2
           WHERE id = $3`,
          ['failed', errorMessage, logId]
        );
      }

      console.error('❌ Erro ao enviar SMS via NitroSMS:', errorMessage);
      
      return {
        success: false,
        logId: logId,
        error: errorMessage
      };
    }
  }

  async sendBulkSMS(tenantId, phones, message, schedule = null, prioritize = false) {
    try {
      const credentials = this.getGlobalCredentials();
      const deviceId = await this.getTenantDeviceId(tenantId);

      const results = [];
      
      for (const phone of phones) {
        const cleanPhone = phone.replace(/\D/g, '');

        const postData = {
          key: credentials.apiKey,
          number: cleanPhone,
          message: message,
          devices: deviceId,
          type: 'sms',
          schedule: schedule,
          prioritize: prioritize ? 1 : 0
        };

        try {
          const response = await axios.post(NITROSMS_API_URL, postData, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          await pool.query(
            `INSERT INTO sms_logs (tenant_id, phone, message, sender_id, status, nitro_response, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [tenantId, phone, message, deviceId, 'sent', JSON.stringify(response.data)]
          );

          results.push({ phone, success: true, response: response.data });
        } catch (error) {
          const errorMessage = error.response?.data || error.message;
          
          await pool.query(
            `INSERT INTO sms_logs (tenant_id, phone, message, sender_id, status, error_message)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenantId, phone, message, deviceId, 'failed', errorMessage]
          );

          results.push({ phone, success: false, error: errorMessage });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ SMS em lote: ${successCount}/${phones.length} enviados com sucesso`);
      
      return {
        success: true,
        count: phones.length,
        successCount: successCount,
        results: results
      };

    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      console.error('❌ Erro ao enviar SMS em lote via NitroSMS:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getSMSLogs(tenantId, filters = {}) {
    try {
      let query = 'SELECT * FROM sms_logs WHERE tenant_id = $1';
      const params = [tenantId];
      let paramIndex = 2;

      if (filters.phone) {
        query += ` AND phone = $${paramIndex}`;
        params.push(filters.phone);
        paramIndex++;
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar logs de SMS:', error.message);
      throw error;
    }
  }
}

module.exports = new NitroSMSService();
