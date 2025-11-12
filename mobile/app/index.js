import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage } from '../utils/storage';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    checkTenant();
  }, []);

  const checkTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    if (!savedTenant) {
      router.replace('/select-tenant');
    } else {
      setTenant(savedTenant);
      setLoading(false);
    }
  };

  const changeTenant = async () => {
    await TenantStorage.clearTenant();
    router.replace('/select-tenant');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

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

  const colors = getThemeColor(tenant?.settings?.theme);

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${colors.bg} pt-12 pb-8 px-6`}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white/80 text-sm">Você está em:</Text>
            <Text className="text-white text-2xl font-bold mt-1">{tenant?.name}</Text>
          </View>
          <TouchableOpacity
            className="bg-white/20 px-4 py-2 rounded-lg"
            onPress={changeTenant}
          >
            <Text className="text-white text-sm font-semibold">Trocar</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white/90 text-base">
          Escolha o modo de acesso:
        </Text>
      </View>

      <View className="flex-1 px-6 -mt-4">
        <TouchableOpacity 
          className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100"
          onPress={() => router.push('/cliente')}
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
          onPress={() => router.push('/prestador')}
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
