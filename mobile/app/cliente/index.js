
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClienteHome() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return { primary: '#ec4899', light: '#fce7f3', text: 'text-pink-600', gradient: ['#ec4899', '#f472b6'] };
      case 'blue':
        return { primary: '#3b82f6', light: '#dbeafe', text: 'text-blue-600', gradient: ['#3b82f6', '#60a5fa'] };
      case 'orange':
        return { primary: '#f97316', light: '#ffedd5', text: 'text-orange-600', gradient: ['#f97316', '#fb923c'] };
      default:
        return { primary: '#0ea5e9', light: '#e0f2fe', text: 'text-sky-600', gradient: ['#0ea5e9', '#38bdf8'] };
    }
  };

  const colors = getThemeColor(tenant?.settings?.theme);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-600 mt-4 text-base font-medium">Carregando serviços...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-10 px-6 rounded-b-[32px] shadow-2xl"
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1">
            <Text className="text-white/90 text-sm font-semibold mb-1 tracking-wide">
              Olá! 👋
            </Text>
            <Text className="text-white text-3xl font-bold mt-1">
              Serviços Disponíveis
            </Text>
          </View>
        </View>
        <Text className="text-white/95 text-base font-medium leading-6">
          Escolha um serviço e faça seu agendamento de forma rápida e fácil
        </Text>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {services.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg border border-gray-100">
            <Text className="text-7xl mb-5">😔</Text>
            <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
              Nenhum serviço disponível
            </Text>
            <Text className="text-gray-500 text-center text-base leading-6 px-4">
              Volte mais tarde para conferir novos serviços incríveis
            </Text>
          </View>
        ) : (
          <View className="mt-4 space-y-4">
            {services.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                className="bg-white rounded-3xl p-6 shadow-lg active:opacity-70 border border-gray-50"
                activeOpacity={0.8}
                onPress={() => router.push(`/cliente/agendar/${service.id}`)}
                style={{
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center mb-2">
                      <View 
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: colors.light }}
                      >
                        <Text className="text-2xl">✂️</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800 mb-1">
                          {service.name}
                        </Text>
                      </View>
                    </View>
                    {service.description && (
                      <Text className="text-gray-600 text-sm leading-6 mt-1">
                        {service.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
                  <View className="flex-row items-center space-x-3">
                    <View className="bg-gray-50 px-4 py-2.5 rounded-full flex-row items-center">
                      <Text className="text-base mr-1">⏱️</Text>
                      <Text className="text-gray-700 text-sm font-semibold">
                        {service.duration} min
                      </Text>
                    </View>
                  </View>
                  {service.price && (
                    <View style={{ backgroundColor: colors.light }} className="px-5 py-2.5 rounded-full">
                      <Text style={{ color: colors.primary }} className="text-lg font-bold">
                        R$ {parseFloat(service.price).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View 
                  style={{ backgroundColor: colors.primary }} 
                  className="mt-5 px-5 py-4 rounded-2xl items-center flex-row justify-center"
                >
                  <Text className="text-white font-bold text-base mr-2">
                    Agendar Agora
                  </Text>
                  <Text className="text-white text-lg">→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Floating Action Button */}
      <View className="px-6 pb-8 pt-4 bg-white/95 border-t border-gray-100">
        <TouchableOpacity 
          className="bg-gray-800 py-5 rounded-2xl flex-row items-center justify-center shadow-xl active:opacity-80"
          activeOpacity={0.8}
          onPress={() => router.push('/cliente/meus-agendamentos')}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-white text-xl font-bold mr-3">📅</Text>
          <Text className="text-white text-base font-bold tracking-wide">
            Meus Agendamentos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
