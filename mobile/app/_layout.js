import { Stack } from 'expo-router';
import '../global.css';

export default function Layout() {
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
