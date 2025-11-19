import { useState } from 'react';
import { Stack } from 'expo-router';
import '../global.css';
import AppSplashScreen from '../components/SplashScreen';

export default function Layout() {
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return <AppSplashScreen onReady={() => setIsReady(true)} />;
  }

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
        name="select-tenant" 
        options={{ 
          title: 'Selecionar Empresa',
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
