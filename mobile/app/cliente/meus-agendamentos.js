import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../config/api';
import { TenantStorage, DeviceStorage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function MeusAgendamentos() {
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

    const id = await DeviceStorage.getDeviceId();
    setDeviceId(id);

    loadAppointments(id);
  };

  const loadAppointments = async (id) => {
    setLoading(true);
    try {
      const response = await apiClient.appointments.getAll({ deviceId: id });
      setAppointments(response.data);
      await TenantStorage.cacheAppointments(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os agendamentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments(deviceId);
  };

  const handleCancel = (id) => {
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.appointments.updateStatus(id, 'cancelado');
              loadAppointments(deviceId);
              Alert.alert('✅ Sucesso', 'Agendamento cancelado com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o agendamento');
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pendente':
        return { 
          bg: '#fef3c7', 
          color: '#92400e', 
          icon: '⏳', 
          text: 'Pendente',
          borderColor: '#fbbf24',
        };
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

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return { primary: '#ec4899', light: '#fce7f3', gradient: ['#ec4899', '#f472b6'] };
      case 'blue':
        return { primary: '#3b82f6', light: '#dbeafe', gradient: ['#3b82f6', '#60a5fa'] };
      case 'orange':
        return { primary: '#f97316', light: '#ffedd5', gradient: ['#f97316', '#fb923c'] };
      default:
        return { primary: '#0ea5e9', light: '#e0f2fe', gradient: ['#0ea5e9', '#38bdf8'] };
    }
  };

  const colors = getThemeColor(tenant?.settings?.theme);

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
          Meus Agendamentos
        </Text>
        <Text className="text-white/95 text-base font-medium">
          Acompanhe seus horários marcados
        </Text>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-gray-600 mt-4 font-medium">Carregando agendamentos...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg border border-gray-100">
            <Text className="text-7xl mb-5">📅</Text>
            <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
              Nenhum agendamento
            </Text>
            <Text className="text-gray-500 text-center mb-8 text-base leading-6 px-4">
              Você ainda não tem horários marcados
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="px-8 py-4 rounded-2xl active:opacity-80 shadow-lg"
              activeOpacity={0.8}
              onPress={() => router.push('/cliente')}
            >
              <Text className="text-white font-bold text-base">Agendar Serviço</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-4 space-y-4">
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
                    style={{ backgroundColor: statusInfo.bg }} 
                    className="self-start px-4 py-2 rounded-full mb-4 border"
                    style={{ backgroundColor: statusInfo.bg, borderColor: statusInfo.borderColor }}
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
                  <View className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-5">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
                        <Text className="text-2xl">📅</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-semibold mb-1">DATA</Text>
                        <Text className="text-gray-800 text-base font-bold">
                          {format(parseISO(appointment.appointment_date), "dd 'de' MMMM", { locale: ptBR })}
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

                  {/* Action Buttons */}
                  {appointment.status === 'pendente' && (
                    <View className="space-y-3">
                      <TouchableOpacity
                        style={{ backgroundColor: colors.primary }}
                        className="py-4 rounded-2xl active:opacity-70 flex-row items-center justify-center"
                        activeOpacity={0.8}
                        onPress={() => router.push(`/cliente/chat/${appointment.id}`)}
                      >
                        <Text className="text-white text-xl mr-2">💬</Text>
                        <Text className="text-white text-center font-bold text-base">
                          Chat com Prestador
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-red-50 border-2 border-red-200 py-4 rounded-2xl active:opacity-70"
                        activeOpacity={0.8}
                        onPress={() => handleCancel(appointment.id)}
                      >
                        <Text className="text-red-600 text-center font-bold text-base">
                          Cancelar Agendamento
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Rating Button */}
                  {appointment.status === 'realizado' && (
                    <View className="flex-row items-center gap-2">
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700 font-semibold text-xs">
                          ✓ Realizado
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push(`/cliente/avaliar/${appointment.id}`)}
                        className="bg-yellow-100 px-3 py-1 rounded-full"
                      >
                        <Text className="text-yellow-700 font-semibold text-xs">
                          ⭐ Avaliar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
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