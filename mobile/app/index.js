import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage, DeviceStorage } from '../utils/storage';
import apiClient from '../config/api';
import { TENANT_CONFIG } from '../config/tenant';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const savedUserType = await DeviceStorage.getUserType();
      
      if (savedUserType) {
        setUserType(savedUserType);
        await loadTenantData();
        setLoading(false);
        router.replace(savedUserType === 'cliente' ? '/cliente' : '/prestador');
      } else {
        await loadTenantData();
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      setLoading(false);
    }
  };

  const loadTenantData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      
      if (!savedTenant || savedTenant.id !== TENANT_CONFIG.TENANT_ID) {
        const response = await apiClient.tenants.getById(TENANT_CONFIG.TENANT_ID);
        const tenantData = response.data;
        await TenantStorage.setTenant(tenantData);
        setTenant(tenantData);
        
        const bootstrap = await apiClient.tenants.getBootstrap(TENANT_CONFIG.TENANT_ID);
        await TenantStorage.setTenantData(bootstrap.data);
      } else {
        setTenant(savedTenant);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
    }
  };

  const selectUserType = async (type) => {
    try {
      setLoading(true);
      const deviceId = await DeviceStorage.getDeviceId();
      
      await DeviceStorage.setUserType(type);
      await DeviceStorage.setUserSession({
        deviceId,
        userType: type,
        tenantId: TENANT_CONFIG.TENANT_ID,
        createdAt: new Date().toISOString(),
      });
      
      setUserType(type);
      router.replace(type === 'cliente' ? '/cliente' : '/prestador');
    } catch (error) {
      console.error('Erro ao selecionar tipo de usuário:', error);
      setLoading(false);
    }
  };

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return { bg: 'bg-pink-500', text: 'text-pink-600' };
      case 'blue':
        return { bg: 'bg-blue-500', text: 'text-blue-600' };
      case 'orange':
        return { bg: 'bg-orange-500', text: 'text-orange-600' };
      default:
        return { bg: 'bg-primary-600', text: 'text-primary-600' };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const colors = getThemeColor(tenant?.settings?.theme);

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${colors.bg} pt-12 pb-8 px-6`}>
        <Text className="text-white text-3xl font-bold mb-2">
          {tenant?.name || 'Bem-vindo!'}
        </Text>
        <Text className="text-white/90 text-base">
          Escolha o modo de acesso:
        </Text>
      </View>

      <View className="flex-1 px-6 -mt-4">
        <TouchableOpacity 
          className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100"
          onPress={() => selectUserType('cliente')}
        >
          <View className={`w-14 h-14 rounded-full ${colors.bg} justify-center items-center mb-3`}>
            <Text className="text-white text-2xl">👤</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Acessar como Cliente
          </Text>
          <Text className="text-gray-600 text-base">
            Visualize serviços e faça seus agendamentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          onPress={() => selectUserType('prestador')}
        >
          <View className="w-14 h-14 rounded-full bg-gray-700 justify-center items-center mb-3">
            <Text className="text-white text-2xl">💼</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Acessar como Prestador
          </Text>
          <Text className="text-gray-600 text-base">
            Gerencie seus serviços e agendamentos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
