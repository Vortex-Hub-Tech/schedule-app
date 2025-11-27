const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');
const { pool } = require('../db');

let firebaseInitialized = false;
let firebaseInitError = null;
const expo = new Expo();

function initializeFirebase() {
  if (firebaseInitialized) {
    return { success: true };
  }

  if (firebaseInitError) {
    return { success: false, error: firebaseInitError };
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      firebaseInitError = 'FIREBASE_SERVICE_ACCOUNT não configurado. Configure a chave de serviço do Firebase para enviar notificações push.';
      console.error(`❌ ${firebaseInitError}`);
      return { success: false, error: firebaseInitError };
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK inicializado com sucesso');
    return { success: true };
  } catch (error) {
    firebaseInitError = `Erro ao inicializar Firebase: ${error.message}`;
    console.error(`❌ ${firebaseInitError}`);
    return { success: false, error: firebaseInitError };
  }
}

async function sendFCMNotification(fcmToken, title, body, data = {}) {
  const initResult = initializeFirebase();
  if (!initResult.success) {
    console.warn(`⚠️ Firebase não disponível: ${initResult.error}. Tentando fallback para Expo...`);
    return { success: false, error: initResult.error, fallbackRequired: true };
  }

  if (!fcmToken) {
    console.error('❌ FCM token não fornecido');
    return { success: false, error: 'Token não fornecido' };
  }

  const message = {
    token: fcmToken,
    notification: {
      title: `📅 AgendaFácil - ${title}`,
      body: body
    },
    data: {
      ...Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        priority: 'max',
        defaultSound: true,
        defaultVibrateTimings: true,
        icon: 'notification_icon',
        color: '#c470d1'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          'content-available': 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ Notificação FCM enviada com sucesso:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação FCM:`, error.message);
    
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.log('⚠️ Token FCM inválido ou expirado, removendo do banco...');
      await removeInvalidFCMToken(fcmToken);
    }
    
    return { success: false, error: error.message, fallbackRequired: true };
  }
}

async function removeInvalidFCMToken(fcmToken) {
  try {
    await pool.query(
      'UPDATE push_tokens SET fcm_token = NULL WHERE fcm_token = $1',
      [fcmToken]
    );
    console.log('✅ FCM Token inválido removido do banco');
  } catch (error) {
    console.error('❌ Erro ao remover FCM token inválido:', error);
  }
}

async function removeInvalidExpoToken(expoToken) {
  try {
    await pool.query(
      'UPDATE push_tokens SET expo_push_token = NULL WHERE expo_push_token = $1',
      [expoToken]
    );
    console.log('✅ Expo Token inválido removido do banco');
  } catch (error) {
    console.error('❌ Erro ao remover Expo token inválido:', error);
  }
}

async function sendExpoNotification(expoPushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Expo Push token inválido: ${expoPushToken}`);
    await removeInvalidExpoToken(expoPushToken);
    return { success: false, error: 'Token Expo inválido' };
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
    const ticket = ticketChunk[0];
    
    if (ticket.status === 'error') {
      console.error(`❌ Erro Expo:`, ticket.message);
      
      if (ticket.details?.error === 'DeviceNotRegistered') {
        console.log('⚠️ Dispositivo não registrado, removendo token...');
        await removeInvalidExpoToken(expoPushToken);
      }
      
      return { success: false, error: ticket.message };
    }
    
    console.log(`✅ Notificação Expo enviada:`, ticket);
    return { success: true, ticket };
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação Expo:`, error);
    return { success: false, error: error.message };
  }
}

async function sendNotificationToOwner(tenantId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT id, fcm_token, expo_push_token FROM push_tokens WHERE tenant_id = $1 AND user_type = $2',
      [tenantId, 'owner']
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ Nenhum token de prestador encontrado para tenant ${tenantId}`);
      return { success: false, error: 'Token não encontrado' };
    }

    const results = [];
    let anySuccess = false;

    for (const row of result.rows) {
      let notificationSent = false;

      if (row.fcm_token) {
        const fcmResult = await sendFCMNotification(row.fcm_token, title, body, data);
        results.push({ type: 'fcm', tokenId: row.id, ...fcmResult });
        
        if (fcmResult.success) {
          notificationSent = true;
          anySuccess = true;
        }
      }

      if (!notificationSent && row.expo_push_token) {
        const expoResult = await sendExpoNotification(row.expo_push_token, title, body, data);
        results.push({ type: 'expo', tokenId: row.id, ...expoResult });
        
        if (expoResult.success) {
          anySuccess = true;
        }
      }
    }

    return { success: anySuccess, results };
  } catch (error) {
    console.error('❌ Erro ao buscar tokens do prestador:', error);
    return { success: false, error: error.message };
  }
}

async function sendNotificationToClient(deviceId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT id, fcm_token, expo_push_token FROM push_tokens WHERE device_id = $1 AND user_type = $2',
      [deviceId, 'client']
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ Nenhum token de cliente encontrado para device ${deviceId}`);
      return { success: false, error: 'Token não encontrado' };
    }

    const results = [];
    let anySuccess = false;

    for (const row of result.rows) {
      let notificationSent = false;

      if (row.fcm_token) {
        const fcmResult = await sendFCMNotification(row.fcm_token, title, body, data);
        results.push({ type: 'fcm', tokenId: row.id, ...fcmResult });
        
        if (fcmResult.success) {
          notificationSent = true;
          anySuccess = true;
        }
      }

      if (!notificationSent && row.expo_push_token) {
        const expoResult = await sendExpoNotification(row.expo_push_token, title, body, data);
        results.push({ type: 'expo', tokenId: row.id, ...expoResult });
        
        if (expoResult.success) {
          anySuccess = true;
        }
      }
    }

    return { success: anySuccess, results };
  } catch (error) {
    console.error('❌ Erro ao buscar token do cliente:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeFirebase,
  sendFCMNotification,
  sendExpoNotification,
  sendNotificationToOwner,
  sendNotificationToClient
};
