import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function registerForPushNotificationsAsync(deviceId, userType, tenantId = null) {
  let expoToken = null;
  let fcmToken = null;

  if (!Device.isDevice) {
    console.log('Push notifications só funcionam em dispositivos físicos');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permissão para notificações negada');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AgendaFácil',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c470d1',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  try {
    const nativeToken = await Notifications.getDevicePushTokenAsync();
    fcmToken = nativeToken.data;
    console.log('🔥 FCM Token (nativo):', fcmToken);
  } catch (error) {
    console.log('⚠️ Não foi possível obter FCM token nativo:', error.message);
  }

  try {
    expoToken = (await Notifications.getExpoPushTokenAsync({
      projectId: '53e8888c-f828-41a7-8fd3-189f68b584c3'
    })).data;
    console.log('📱 Expo Push Token:', expoToken);
  } catch (error) {
    console.log('⚠️ Não foi possível obter Expo token:', error.message);
  }

  if (!fcmToken && !expoToken) {
    console.error('❌ Nenhum token de push obtido');
    return null;
  }

  try {
    await apiClient.pushTokens.register({
      device_id: deviceId,
      expo_push_token: expoToken,
      fcm_token: fcmToken,
      user_type: userType,
      tenant_id: tenantId
    });

    console.log('✅ Push tokens registrados no backend');
    console.log(`   - FCM: ${fcmToken ? 'Sim' : 'Não'}`);
    console.log(`   - Expo: ${expoToken ? 'Sim' : 'Não'}`);
  } catch (error) {
    console.error('❌ Erro ao registrar push tokens:', error);
  }

  return { expoToken, fcmToken };
}

export function setupNotificationListeners(notificationListener, responseListener) {
  const subscription = Notifications.addNotificationReceivedListener(notificationListener);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(responseListener);

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
