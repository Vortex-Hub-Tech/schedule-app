import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
    }
  };

  const handleCancel = (id) => {
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.appointments.updateStatus(id, 'cancelado');
              loadAppointments(deviceId);
              Alert.alert('Sucesso', 'Agendamento cancelado');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'realizado':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'cancelado':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
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

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Meus Agendamentos</Text>
        <Text className="text-white/90">Consulte seus agendamentos</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4">
        {loading ? (
          <View className="bg-white rounded-xl p-8 items-center mt-4">
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text className="text-gray-600 mt-4">Carregando...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center mt-4">
            <Text className="text-6xl mb-4">📅</Text>
            <Text className="text-gray-500 text-center text-base">
              Você ainda não tem agendamentos
            </Text>
            <TouchableOpacity
              className={`${themeBg} px-6 py-3 rounded-lg mt-4`}
              onPress={() => router.push('/cliente')}
            >
              <Text className="text-white font-semibold">Agendar Serviço</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-4">
            {appointments.map((appointment) => {
              const statusColors = getStatusColor(appointment.status);
              return (
                <View key={appointment.id} className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <Text className="text-xl font-bold text-gray-800 flex-1">
                      {appointment.service_name}
                    </Text>
                    <View className={`${statusColors.bg} px-3 py-1 rounded-full`}>
                      <Text className={`text-xs font-bold ${statusColors.text} uppercase`}>
                        {appointment.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="space-y-2 mb-4">
                    <Text className="text-gray-600 text-base">
                      📅 {format(parseISO(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Text>
                    <Text className="text-gray-600 text-base">
                      ⏰ {appointment.appointment_time.substring(0, 5)}
                    </Text>
                    <Text className="text-gray-600 text-base">
                      👤 {appointment.client_name}
                    </Text>
                  </View>

                  {appointment.status === 'pendente' && (
                    <TouchableOpacity
                      className="bg-red-500 py-3 rounded-lg"
                      onPress={() => handleCancel(appointment.id)}
                    >
                      <Text className="text-white text-center font-semibold">
                        Cancelar Agendamento
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
