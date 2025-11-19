
import { Stack } from 'expo-router';

export default function ClienteLayout() {
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
        name="agendar/[id]" 
        options={{ 
          title: 'Agendar Serviço',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
