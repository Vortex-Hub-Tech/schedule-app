import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import * as Device from 'expo-device';
import { TENANT_ID } from '../../config/tenant';

export default function ClienteLayout() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        const deviceId = await Device.getDeviceIdAsync();
        await registerForPushNotificationsAsync(deviceId, 'client', TENANT_ID);
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    setupPushNotifications();
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
          title: 'Serviços Disponíveis',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="meus-agendamentos" 
        options={{ 
          title: 'Meus Agendamentos',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="estatisticas" 
        options={{ 
          title: 'Estatísticas',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="favoritos" 
        options={{ 
          title: 'Favoritos',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="historico" 
        options={{ 
          title: 'Histórico',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="agendar/[id]" 
        options={{ 
          title: 'Agendar Serviço',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="avaliar/[id]" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          title: 'Chat',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
