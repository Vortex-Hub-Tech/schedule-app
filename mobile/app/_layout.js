import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { setupNotificationListeners } from '../utils/pushNotifications';
import '../global.css';

export default function Layout() {
  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuário interagiu com a notificação:', response);
      const data = response.notification.request.content.data;
      
      if (data.type === 'new_appointment' && data.appointmentId) {
        router.push('/prestador/agendamentos');
      } else if (data.type === 'appointment_confirmed' && data.appointmentId) {
        router.push('/cliente/meus-agendamentos');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0ea5e9',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Bem-vindo',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="cliente" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="prestador" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
