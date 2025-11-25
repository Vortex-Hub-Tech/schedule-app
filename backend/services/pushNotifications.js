const { Expo } = require('expo-server-sdk');
const { pool } = require('../db');

const expo = new Expo();

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Push token inválido: ${expoPushToken}`);
    return { success: false, error: 'Token inválido' };
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: `📅 AgendaFácil - ${title}`,
    body: body,
    data: data,
    priority: 'high',
    badge: 1,
  };

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log(`✅ Notificação enviada:`, ticketChunk);
    return { success: true, ticket: ticketChunk[0] };
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação:`, error);
    return { success: false, error: error.message };
  }
}

async function sendNotificationToOwner(tenantId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT expo_push_token FROM push_tokens WHERE tenant_id = $1 AND user_type = $2',
      [tenantId, 'owner']
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ Nenhum token de prestador encontrado para tenant ${tenantId}`);
      return { success: false, error: 'Token não encontrado' };
    }

    const tokens = result.rows.map(row => row.expo_push_token);
    const results = [];

    for (const token of tokens) {
      const result = await sendPushNotification(token, title, body, data);
      results.push(result);
    }

    return { success: true, results };
  } catch (error) {
    console.error('❌ Erro ao buscar tokens do prestador:', error);
    return { success: false, error: error.message };
  }
}

async function sendNotificationToClient(deviceId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT expo_push_token FROM push_tokens WHERE device_id = $1 AND user_type = $2',
      [deviceId, 'client']
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ Nenhum token de cliente encontrado para device ${deviceId}`);
      return { success: false, error: 'Token não encontrado' };
    }

    const token = result.rows[0].expo_push_token;
    return await sendPushNotification(token, title, body, data);
  } catch (error) {
    console.error('❌ Erro ao buscar token do cliente:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendNotificationToOwner,
  sendNotificationToClient
};
