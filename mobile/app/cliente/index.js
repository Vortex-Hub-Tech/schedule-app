import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';

export default function ClienteHome() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    
    const cached = await TenantStorage.getCachedServices();
    if (cached && !cached.isStale) {
      setServices(cached.data);
      setLoading(false);
    }
    
    loadServices();
  };

  const loadServices = async () => {
    try {
      const response = await apiClient.services.getAll();
      setServices(response.data);
      await TenantStorage.cacheServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Serviços Disponíveis</Text>
        <Text className="text-white/90">Escolha um serviço para agendar</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4">
        {services.length === 0 ? (
          <View className="bg-white rounded-xl p-8 shadow-sm">
            <Text className="text-gray-500 text-center text-base">
              Nenhum serviço disponível no momento
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100"
              onPress={() => router.push(`/cliente/agendar/${service.id}`)}
            >
              <Text className="text-xl font-bold text-gray-800 mb-2">{service.name}</Text>
              {service.description && (
                <Text className="text-gray-600 mb-3 text-base leading-5">{service.description}</Text>
              )}
              <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm">⏱️ {service.duration} min</Text>
                </View>
                {service.price && (
                  <Text className={`text-lg font-bold ${themeBg.replace('bg-', 'text-')}`}>
                    R$ {parseFloat(service.price).toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity 
          className="bg-gray-700 py-4 rounded-xl"
          onPress={() => router.push('/cliente/meus-agendamentos')}
        >
          <Text className="text-white text-center font-semibold text-base">
            📅 Meus Agendamentos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
