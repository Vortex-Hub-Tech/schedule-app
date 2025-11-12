import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';

export default function AgendamentosPrestador() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadAppointments();
    }
  }, [filter]);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    setLoading(false);
    loadAppointments();
  };

  const loadAppointments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await apiClient.appointments.getAll(params);
      setAppointments(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os agendamentos');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient.appointments.updateStatus(id, newStatus);
      loadAppointments();
      Alert.alert('Sucesso ✅', 'Status atualizado');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500' };
      case 'realizado':
        return { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' };
      case 'cancelado':
        return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' };
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
      <View className={`${themeBg} pt-12 pb-6 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Agendamentos</Text>
        <Text className="text-white/90">{appointments.length} agendamento(s)</Text>
      </View>

      <View className="px-3 -mt-2 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {['all', 'pendente', 'realizado', 'cancelado'].map((status) => (
            <TouchableOpacity
              key={status}
              className={`px-4 py-2 rounded-lg mr-2 ${
                filter === status ? themeBg : 'bg-white border border-gray-200'
              }`}
              onPress={() => setFilter(status)}
            >
              <Text className={`font-semibold capitalize ${
                filter === status ? 'text-white' : 'text-gray-700'
              }`}>
                {status === 'all' ? 'Todos' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6">
          {appointments.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-gray-500 text-center text-base">
                Nenhum agendamento encontrado
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const statusColors = getStatusColor(appointment.status);
              return (
                <View key={appointment.id} className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800 mb-1">
                        {appointment.service_name}
                      </Text>
                      <Text className="text-gray-600 text-base">
                        👤 {appointment.client_name}
                      </Text>
                      <Text className="text-gray-600 text-base">
                        📞 {appointment.client_phone}
                      </Text>
                    </View>
                    <View className={`${statusColors.badge} px-3 py-1 rounded-full`}>
                      <Text className="text-white text-xs font-bold uppercase">
                        {appointment.status}
                      </Text>
                    </View>
                  </View>

                  <View className="py-3 border-t border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">
                      📅 {format(parseISO(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Text>
                    <Text className="text-gray-600 text-base mt-1">
                      ⏰ {appointment.appointment_time.substring(0, 5)}
                    </Text>
                  </View>

                  {appointment.status === 'pendente' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-green-500 py-3 rounded-lg"
                        onPress={() => handleUpdateStatus(appointment.id, 'realizado')}
                      >
                        <Text className="text-white text-center font-semibold">✓ Realizado</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-red-500 py-3 rounded-lg"
                        onPress={() => handleUpdateStatus(appointment.id, 'cancelado')}
                      >
                        <Text className="text-white text-center font-semibold">✗ Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
