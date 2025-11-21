
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../config/api';
import { TenantStorage, DeviceStorage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors } from '../../utils/theme';

export default function Historico() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    
    const id = await DeviceStorage.getCanonicalDeviceId();
    setDeviceId(id);
    
    loadAppointments(id);
  };

  const loadAppointments = async (id) => {
    setLoading(true);
    try {
      const response = await apiClient.appointments.getAll({ deviceId: id });
      // Filter only completed and cancelled appointments
      const historicalAppointments = response.data.filter(
        apt => apt.status === 'realizado' || apt.status === 'cancelado'
      );
      setAppointments(historicalAppointments);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments(deviceId);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'realizado':
        return { 
          bg: '#d1fae5', 
          color: '#065f46', 
          icon: '✅', 
          text: 'Realizado',
          borderColor: '#10b981',
        };
      case 'cancelado':
        return { 
          bg: '#fee2e2', 
          color: '#991b1b', 
          icon: '❌', 
          text: 'Cancelado',
          borderColor: '#ef4444',
        };
      default:
        return { 
          bg: '#f3f4f6', 
          color: '#374151', 
          icon: '📅', 
          text: status,
          borderColor: '#d1d5db',
        };
    }
  };

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  const stats = {
    total: appointments.length,
    realizados: appointments.filter(a => a.status === 'realizado').length,
    cancelados: appointments.filter(a => a.status === 'cancelado').length,
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-10 px-6 rounded-b-[32px] shadow-2xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-5" activeOpacity={0.7}>
          <View className="flex-row items-center bg-white/20 self-start px-4 py-2 rounded-xl">
            <Text className="text-white text-xl mr-2">←</Text>
            <Text className="text-white text-sm font-semibold">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-2">
          Histórico
        </Text>
        <Text className="text-white/95 text-base font-medium">
          Seus agendamentos concluídos e cancelados
        </Text>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats Cards */}
        <View className="flex-row gap-3 mb-6 mt-4">
          <View className="bg-white rounded-2xl p-4 flex-1 shadow-lg">
            <Text className="text-3xl mb-2">📋</Text>
            <Text className="text-gray-500 text-xs font-semibold mb-1">TOTAL</Text>
            <Text className="text-2xl font-bold text-gray-800">{stats.total}</Text>
          </View>
          <View className="bg-white rounded-2xl p-4 flex-1 shadow-lg">
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-gray-500 text-xs font-semibold mb-1">REALIZADOS</Text>
            <Text className="text-2xl font-bold text-green-600">{stats.realizados}</Text>
          </View>
          <View className="bg-white rounded-2xl p-4 flex-1 shadow-lg">
            <Text className="text-3xl mb-2">❌</Text>
            <Text className="text-gray-500 text-xs font-semibold mb-1">CANCELADOS</Text>
            <Text className="text-2xl font-bold text-red-600">{stats.cancelados}</Text>
          </View>
        </View>

        {loading ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-gray-600 mt-4 font-medium">Carregando histórico...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg border border-gray-100">
            <Text className="text-7xl mb-5">🕐</Text>
            <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
              Nenhum registro histórico
            </Text>
            <Text className="text-gray-500 text-center mb-8 text-base leading-6 px-4">
              Você ainda não possui agendamentos concluídos ou cancelados
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {appointments.map((appointment) => {
              const statusInfo = getStatusInfo(appointment.status);
              return (
                <View 
                  key={appointment.id} 
                  className="bg-white rounded-3xl p-6 shadow-lg border"
                  style={{ borderColor: statusInfo.borderColor, borderWidth: 1 }}
                >
                  {/* Status Badge */}
                  <View 
                    style={{ backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }} 
                    className="self-start px-4 py-2 rounded-full mb-4 border"
                  >
                    <Text style={{ color: statusInfo.color }} className="text-xs font-bold tracking-wide">
                      {statusInfo.icon} {statusInfo.text.toUpperCase()}
                    </Text>
                  </View>

                  {/* Service Name */}
                  <Text className="text-2xl font-bold text-gray-800 mb-5">
                    {appointment.service_name}
                  </Text>

                  {/* Info Cards */}
                  <View className="bg-gray-50 rounded-2xl p-5 space-y-4">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
                        <Text className="text-2xl">📅</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-semibold mb-1">DATA</Text>
                        <Text className="text-gray-800 text-base font-bold">
                          {format(parseISO(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
                        <Text className="text-2xl">🕐</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-semibold mb-1">HORÁRIO</Text>
                        <Text className="text-gray-800 text-base font-bold">
                          {appointment.appointment_time.substring(0, 5)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
                        <Text className="text-2xl">👤</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-semibold mb-1">NOME</Text>
                        <Text className="text-gray-800 text-base font-bold">
                          {appointment.client_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
