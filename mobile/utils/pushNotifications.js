import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(deviceId, userType, tenantId = null) {
  let token;

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

  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '53e8888c-f828-41a7-8fd3-189f68b584c3'
    })).data;
    
    console.log('Expo Push Token:', token);

    await api.post('/push-tokens/register', {
      device_id: deviceId,
      expo_push_token: token,
      user_type: userType,
      tenant_id: tenantId
    });

    console.log('✅ Push token registrado no backend');
  } catch (error) {
    console.error('❌ Erro ao registrar push token:', error);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c470d1',
    });
  }

  return token;
}

export function setupNotificationListeners(notificationListener, responseListener) {
  const subscription = Notifications.addNotificationReceivedListener(notificationListener);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(responseListener);

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
