import { Stack } from 'expo-router';

export default function PrestadorLayout() {
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
    </Stack>
  );
}
