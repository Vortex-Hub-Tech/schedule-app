import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';

export default function MeusAgendamentos() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
  };

  const loadAppointments = async () => {
    if (!phone.trim()) {
      Alert.alert('Atenção', 'Digite seu telefone');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.appointments.getAll({ phone });
      setAppointments(response.data);
      setSearched(true);
      await TenantStorage.cacheAppointments(response.data);
    } catch (error) {
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
              loadAppointments();
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

      <View className="px-6 -mt-4 mb-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3 text-base"
            placeholder="Digite seu telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            className={`${themeBg} py-4 rounded-lg`}
            onPress={loadAppointments}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading ? 'Buscando...' : 'Buscar Agendamentos'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {loading ? (
          <View className="py-12">
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : searched && appointments.length === 0 ? (
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
          })
        )}
      </ScrollView>
    </View>
  );
}
