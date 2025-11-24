import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import { DeviceStorage } from '../../utils/storage';

export default function ClienteLayout() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        const session = await DeviceStorage.getUserSession();
        if (session && session.deviceId && session.tenantId) {
          await registerForPushNotificationsAsync(
            session.deviceId, 
            'client', 
            session.tenantId
          );
        }
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
