import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage } from '../../utils/storage';

export default function PrestadorHome() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
  };

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return 'bg-pink-500';
      case 'blue':
        return 'bg-blue-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-primary-600';
    }
  };

  const themeBg = getThemeColor(tenant?.settings?.theme);

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Painel do Prestador</Text>
        <Text className="text-white/90">Gerencie seu negócio</Text>
      </View>

      <View className="flex-1 px-6 -mt-4">
        <TouchableOpacity
          className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100"
          onPress={() => router.push('/prestador/servicos')}
        >
          <View className={`w-14 h-14 rounded-full ${themeBg} justify-center items-center mb-3`}>
            <Text className="text-white text-2xl">📋</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Gerenciar Serviços
          </Text>
          <Text className="text-gray-600 text-base">
            Adicione, edite ou remova seus serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          onPress={() => router.push('/prestador/agendamentos')}
        >
          <View className={`w-14 h-14 rounded-full ${themeBg} justify-center items-center mb-3`}>
            <Text className="text-white text-2xl">📅</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Ver Agendamentos
          </Text>
          <Text className="text-gray-600 text-base">
            Visualize e gerencie seus agendamentos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
