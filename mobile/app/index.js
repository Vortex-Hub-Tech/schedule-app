import { View, Text, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
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
        return { 
          primary: '#ec4899', 
          light: '#fce7f3',
          gradient: ['#ec4899', '#f472b6']
        };
      case 'blue':
        return { 
          primary: '#3b82f6', 
          light: '#dbeafe',
          gradient: ['#3b82f6', '#60a5fa']
        };
      case 'orange':
        return { 
          primary: '#f97316', 
          light: '#ffedd5',
          gradient: ['#f97316', '#fb923c']
        };
      default:
        return { 
          primary: '#0ea5e9', 
          light: '#e0f2fe',
          gradient: ['#0ea5e9', '#38bdf8']
        };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#ec4899" />
        <Text className="text-gray-600 mt-4 text-base">Carregando...</Text>
      </View>
    );
  }

  const colors = getThemeColor(tenant?.settings?.theme);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header com gradiente */}
      <View style={{ backgroundColor: colors.primary }} className="pt-16 pb-12 px-6 rounded-b-3xl shadow-lg">
        <View className="items-center mb-6">
          <View className="bg-white/20 w-20 h-20 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-4xl">📅</Text>
          </View>
          <Text className="text-white text-3xl font-bold text-center">
            {tenant?.name || 'Bem-vindo!'}
          </Text>
          <Text className="text-white/90 text-base mt-2 text-center">
            Sistema de Agendamento Online
          </Text>
        </View>
      </View>

      {/* Escolha de perfil */}
      <View className="flex-1 px-6 -mt-8">
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-md">
          <Text className="text-gray-800 text-xl font-bold mb-2 text-center">
            Como você deseja acessar?
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Escolha o perfil adequado para continuar
          </Text>
          
          <View className="space-y-4">
            {/* Card Cliente */}
            <TouchableOpacity 
              style={{ backgroundColor: colors.light }}
              className="rounded-2xl p-6 border-2 active:opacity-70"
              activeOpacity={0.8}
              onPress={() => selectUserType('cliente')}
            >
              <View className="flex-row items-center">
                <View style={{ backgroundColor: colors.primary }} className="w-16 h-16 rounded-full items-center justify-center">
                  <Text className="text-white text-3xl">👤</Text>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-gray-800 text-xl font-bold mb-1">
                    Sou Cliente
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Agendar serviços e consultar horários
                  </Text>
                </View>
                <Text className="text-gray-400 text-2xl">›</Text>
              </View>
            </TouchableOpacity>

            {/* Card Prestador */}
            <TouchableOpacity 
              className="bg-gray-100 rounded-2xl p-6 border-2 border-gray-200 active:opacity-70"
              activeOpacity={0.8}
              onPress={() => selectUserType('prestador')}
            >
              <View className="flex-row items-center">
                <View className="bg-gray-700 w-16 h-16 rounded-full items-center justify-center">
                  <Text className="text-white text-3xl">💼</Text>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-gray-800 text-xl font-bold mb-1">
                    Sou Prestador
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Gerenciar serviços e agendamentos
                  </Text>
                </View>
                <Text className="text-gray-400 text-2xl">›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer informativo */}
        <View className="items-center px-4 py-6">
          <Text className="text-gray-400 text-xs text-center">
            Sua escolha será lembrada neste dispositivo
          </Text>
        </View>
      </View>
    </View>
  );
}
