import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import * as Device from 'expo-device';
import { TENANT_ID } from '../../config/tenant';

export default function PrestadorLayout() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        const deviceId = await Device.getDeviceIdAsync();
        await registerForPushNotificationsAsync(deviceId, 'owner', TENANT_ID);
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
          title: 'Painel do Prestador',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="agendamentos" 
        options={{ 
          title: 'Gerenciar Agendamentos',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="relatorios" 
        options={{ 
          title: 'Relatórios',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="configuracoes" 
        options={{ 
          title: 'Configurações',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="perfil" 
        options={{ 
          title: 'Meu Perfil',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="avaliacoes" 
        options={{ 
          title: 'Avaliações',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="servicos/index" 
        options={{ 
          title: 'Meus Serviços',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="servicos/novo" 
        options={{ 
          title: 'Novo Serviço',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="servicos/editar/[id]" 
        options={{ 
          title: 'Editar Serviço',
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
