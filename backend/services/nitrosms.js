const axios = require('axios');
const { pool, vortexPool } = require('../db');

const NITROSMS_API_URL = 'http://nitrosms.cm/api_v1';

class NitroSMSService {
  async getTenantConfig(tenantId) {
    try {
      const result = await vortexPool.query(
        `SELECT nitro_sub_account, nitro_sub_account_pass, nitro_sender_id 
         FROM integrations 
         WHERE tenant_id = $1 
         AND type = 'sms' 
         AND is_active = true
         LIMIT 1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Configuração NitroSMS não encontrada para este tenant');
      }

      const config = result.rows[0];
      
      if (!config.nitro_sub_account || !config.nitro_sub_account_pass || !config.nitro_sender_id) {
        throw new Error('Configuração NitroSMS incompleta. Configure sub_account, sub_account_pass e sender_id');
      }

      return {
        subAccount: config.nitro_sub_account,
        subAccountPass: config.nitro_sub_account_pass,
        senderId: config.nitro_sender_id
      };
    } catch (error) {
      console.error('❌ Erro ao buscar configuração NitroSMS:', error.message);
      throw error;
    }
  }

  async sendSMS(tenantId, phone, message) {
    let logId = null;
    
    try {
      const config = await this.getTenantConfig(tenantId);

      const logResult = await pool.query(
        `INSERT INTO sms_logs (tenant_id, phone, message, sender_id, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tenantId, phone, message, config.senderId, 'sending']
      );
      logId = logResult.rows[0].id;

      const cleanPhone = phone.replace(/\D/g, '');

      const params = new URLSearchParams({
        sub_account: config.subAccount,
        sub_account_pass: config.subAccountPass,
        action: 'send_sms',
        sender_id: config.senderId,
        message: message,
        recipients: cleanPhone
      });

      const response = await axios.post(NITROSMS_API_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      await pool.query(
        `UPDATE sms_logs 
         SET status = $1, nitro_response = $2, sent_at = NOW()
         WHERE id = $3`,
        ['sent', JSON.stringify(response.data), logId]
      );

      console.log(`✅ SMS enviado para ${phone} via NitroSMS (Sender: ${config.senderId}, Log ID: ${logId})`);
      
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

  async sendBulkSMS(tenantId, phones, message) {
    try {
      const config = await this.getTenantConfig(tenantId);

      const cleanPhones = phones.map(p => p.replace(/\D/g, '')).join(',');

      const params = new URLSearchParams({
        sub_account: config.subAccount,
        sub_account_pass: config.subAccountPass,
        action: 'send_sms',
        sender_id: config.senderId,
        message: message,
        recipients: cleanPhones
      });

      const response = await axios.post(NITROSMS_API_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      for (const phone of phones) {
        await pool.query(
          `INSERT INTO sms_logs (tenant_id, phone, message, sender_id, status, nitro_response, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [tenantId, phone, message, config.senderId, 'sent', JSON.stringify(response.data)]
        );
      }

      console.log(`✅ SMS em lote enviado para ${phones.length} destinatários via NitroSMS`);
      
      return {
        success: true,
        count: phones.length,
        response: response.data
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
