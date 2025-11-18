import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage, DeviceStorage } from '../utils/storage';
import apiClient from '../config/api';
import { TENANT_CONFIG } from '../config/tenant';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Carrega dados da tenant
      await loadTenantData();

      // Obtém device_id do dispositivo
      const deviceId = await DeviceStorage.getDeviceId();

      console.log('Device ID:', deviceId);
      // Verifica se é proprietário
      const ownerCheck = await apiClient.owner.verifyOwner(
        TENANT_CONFIG.TENANT_ID,
        deviceId
      );

      // Define tipo de usuário baseado na verificação
      const userType = ownerCheck.data.isOwner ? 'prestador' : 'cliente';

      // Salva tipo de usuário
      await DeviceStorage.setUserType(userType);
      await DeviceStorage.setUserSession({
        deviceId,
        userType,
        tenantId: TENANT_CONFIG.TENANT_ID,
        createdAt: new Date().toISOString(),
      });

      // Redireciona para a tela apropriada
      setLoading(false);
      router.replace(userType === 'cliente' ? '/cliente' : '/prestador');
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      setLoading(false);
      // Em caso de erro, assume como cliente
      router.replace('/cliente');
    }
  };

  const loadTenantData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();

      if (!savedTenant || savedTenant.id !== TENANT_CONFIG.TENANT_ID) {
        const response = await apiClient.tenants.getById(TENANT_CONFIG.TENANT_ID);
        const tenantData = response.data;
        await TenantStorage.setTenant(tenantData);

        const bootstrap = await apiClient.tenants.getBootstrap(TENANT_CONFIG.TENANT_ID);
        await TenantStorage.setTenantData(bootstrap.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
      throw error;
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#ec4899" />
      <Text className="text-gray-600 mt-4 text-base">Carregando...</Text>
    </View>
  );
}