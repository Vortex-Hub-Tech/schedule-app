import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../config/api';
import { TenantStorage, DeviceStorage } from '../../utils/storage';

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
          text: 'Pendente' 
        };
      case 'realizado':
        return { 
          bg: '#d1fae5', 
          color: '#065f46', 
          icon: '✅', 
          text: 'Realizado' 
        };
      case 'cancelado':
        return { 
          bg: '#fee2e2', 
          color: '#991b1b', 
          icon: '❌', 
          text: 'Cancelado' 
        };
      default:
        return { 
          bg: '#f3f4f6', 
          color: '#374151', 
          icon: '📅', 
          text: status 
        };
    }
  };

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return { primary: '#ec4899', light: '#fce7f3' };
      case 'blue':
        return { primary: '#3b82f6', light: '#dbeafe' };
      case 'orange':
        return { primary: '#f97316', light: '#ffedd5' };
      default:
        return { primary: '#0ea5e9', light: '#e0f2fe' };
    }
  };

  const colors = getThemeColor(tenant?.settings?.theme);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-8 px-6 rounded-b-3xl shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">
          Meus Agendamentos
        </Text>
        <Text className="text-white/90 text-base">
          Acompanhe seus horários marcados
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View className="bg-white rounded-2xl p-8 mt-4 items-center shadow-sm">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-gray-600 mt-4">Carregando agendamentos...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 mt-4 items-center shadow-sm">
            <Text className="text-6xl mb-4">📅</Text>
            <Text className="text-gray-800 text-lg font-bold mb-2 text-center">
              Nenhum agendamento encontrado
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Você ainda não tem horários marcados
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="px-6 py-3 rounded-xl active:opacity-80"
              activeOpacity={0.8}
              onPress={() => router.push('/cliente')}
            >
              <Text className="text-white font-bold text-base">Agendar Serviço</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-4">
            {appointments.map((appointment) => {
              const statusInfo = getStatusInfo(appointment.status);
              return (
                <View key={appointment.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                  {/* Header do Card */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800 mb-1">
                        {appointment.service_name}
                      </Text>
                      <View 
                        style={{ backgroundColor: statusInfo.bg }} 
                        className="self-start px-3 py-1 rounded-full mt-2"
                      >
                        <Text style={{ color: statusInfo.color }} className="text-xs font-bold">
                          {statusInfo.icon} {statusInfo.text.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Informações */}
                  <View className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">📅</Text>
                      <Text className="text-gray-700 text-base font-medium">
                        {format(parseISO(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">🕐</Text>
                      <Text className="text-gray-700 text-base font-medium">
                        {appointment.appointment_time.substring(0, 5)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👤</Text>
                      <Text className="text-gray-700 text-base font-medium">
                        {appointment.client_name}
                      </Text>
                    </View>
                  </View>

                  {/* Botão de Cancelar */}
                  {appointment.status === 'pendente' && (
                    <TouchableOpacity
                      className="bg-red-50 border border-red-200 py-3 rounded-xl mt-4 active:opacity-70"
                      activeOpacity={0.8}
                      onPress={() => handleCancel(appointment.id)}
                    >
                      <Text className="text-red-600 text-center font-bold text-base">
                        Cancelar Agendamento
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
