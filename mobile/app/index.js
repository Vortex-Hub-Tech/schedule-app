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
      await loadTenantData();

      const deviceId = await DeviceStorage.ensureSyncedDeviceId(
        apiClient,
        TENANT_CONFIG.TENANT_ID
      );

      const ownerCheck = await apiClient.owner.verifyOwner(
        TENANT_CONFIG.TENANT_ID,
        deviceId
      );

      const userType = ownerCheck.data.isOwner ? 'prestador' : 'cliente';

      await DeviceStorage.setUserType(userType);
      await DeviceStorage.setUserSession({
        deviceId,
        userType,
        tenantId: TENANT_CONFIG.TENANT_ID,
        createdAt: new Date().toISOString(),
      });

      router.replace(userType === 'cliente' ? '/cliente' : '/prestador');
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      router.replace('/cliente');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantData = async () => {
    const savedTenant = await TenantStorage.getTenant();

    if (!savedTenant || savedTenant.id !== TENANT_CONFIG.TENANT_ID) {
      const response = await apiClient.tenants.getById(TENANT_CONFIG.TENANT_ID);
      await TenantStorage.setTenant(response.data);

      const bootstrap = await apiClient.tenants.getBootstrap(TENANT_CONFIG.TENANT_ID);

      if (bootstrap?.data && typeof bootstrap.data === 'object') {
        await TenantStorage.setTenantData(bootstrap.data);
      }
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#ec4899" />
      <Text className="text-gray-600 mt-4 text-base">Carregando...</Text>
    </View>
  );
}
