
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';

export default function Relatorios() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    loadAnalytics();
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.analytics.getDashboard();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = getThemeColors(tenant?.settings?.theme);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-600 mt-4">Carregando relatórios...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-6 px-6 shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-1">📊 Relatórios</Text>
        <Text className="text-white/90 text-base">Analytics e métricas do negócio</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4">
        {/* Cards de Resumo */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="bg-white rounded-2xl p-4 shadow-sm flex-1" style={{ minWidth: '45%' }}>
            <Text className="text-3xl mb-2">📊</Text>
            <Text className="text-gray-500 text-sm mb-1">Total</Text>
            <Text className="text-2xl font-bold text-gray-800">
              {analytics?.summary?.total || 0}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">agendamentos</Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-1" style={{ minWidth: '45%' }}>
            <Text className="text-3xl mb-2">💰</Text>
            <Text className="text-gray-500 text-sm mb-1">Faturamento</Text>
            <Text className="text-2xl font-bold text-green-600">
              R$ {parseFloat(analytics?.summary?.total_revenue || 0).toFixed(2)}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">realizados</Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-1" style={{ minWidth: '45%' }}>
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-gray-500 text-sm mb-1">Realizados</Text>
            <Text className="text-2xl font-bold text-green-600">
              {analytics?.summary?.realizados || 0}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">concluídos</Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-1" style={{ minWidth: '45%' }}>
            <Text className="text-3xl mb-2">👥</Text>
            <Text className="text-gray-500 text-sm mb-1">Clientes</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
              {analytics?.summary?.unique_clients || 0}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">únicos</Text>
          </View>
        </View>

        {/* Top Serviços */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🏆 Serviços Mais Populares
          </Text>
          {analytics?.topServices?.map((service, index) => (
            <View key={index} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="font-bold text-gray-800">{service.name}</Text>
                <Text className="text-gray-500 text-sm">
                  {service.total_bookings} agendamentos
                </Text>
              </View>
              <Text className="font-bold text-green-600">
                R$ {parseFloat(service.revenue || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Horários de Pico */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            ⏰ Horários de Pico
          </Text>
          {analytics?.peakHours?.map((hour, index) => (
            <View key={index} className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">{hour.hour}:00</Text>
              <View className="flex-row items-center">
                <View 
                  style={{ 
                    width: `${(hour.bookings / analytics.peakHours[0].bookings) * 100}%`,
                    backgroundColor: colors.primary,
                    minWidth: 40
                  }} 
                  className="h-6 rounded-full mr-2"
                />
                <Text className="font-bold text-gray-800">{hour.bookings}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Clientes */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            ⭐ Clientes Mais Frequentes
          </Text>
          {analytics?.topClients?.slice(0, 5).map((client, index) => (
            <View key={index} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="font-bold text-gray-800">{client.client_name}</Text>
                <Text className="text-gray-500 text-sm">{client.client_phone}</Text>
              </View>
              <View className="items-end">
                <Text className="font-bold" style={{ color: colors.primary }}>
                  {client.total_appointments}x
                </Text>
                <Text className="text-gray-500 text-xs">agendamentos</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
