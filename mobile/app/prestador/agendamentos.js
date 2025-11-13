import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
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
    loadAppointments();
  };

  const loadAppointments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await apiClient.appointments.getAll(params);
      setAppointments(response.data);
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
    loadAppointments();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const statusMessages = {
      pendente: 'Agendamento marcado como pendente',
      realizado: 'Agendamento marcado como realizado',
      cancelado: 'Agendamento cancelado',
    };

    Alert.alert(
      'Atualizar Status',
      `Deseja ${statusMessages[newStatus].toLowerCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await apiClient.appointments.updateStatus(id, newStatus);
              loadAppointments();
              Alert.alert('✅ Sucesso', statusMessages[newStatus]);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pendente':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳', text: 'Pendente' };
      case 'realizado':
        return { bg: '#d1fae5', color: '#065f46', icon: '✅', text: 'Realizado' };
      case 'cancelado':
        return { bg: '#fee2e2', color: '#991b1b', icon: '❌', text: 'Cancelado' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '📅', text: status };
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

  const filterButtons = [
    { value: 'all', label: 'Todos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'realizado', label: 'Realizados' },
    { value: 'cancelado', label: 'Cancelados' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-6 px-6 rounded-b-3xl shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Agendamentos</Text>
        <Text className="text-white/90 text-base">
          {appointments.length} agendamento(s) {filter !== 'all' ? `- ${filter}` : ''}
        </Text>
      </View>

      {/* Filtros */}
      <View className="px-3 -mt-2 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.value}
              style={{
                backgroundColor: filter === btn.value ? colors.primary : '#fff',
              }}
              className={`px-5 py-3 rounded-full mr-3 ${
                filter === btn.value ? '' : 'border border-gray-200'
              }`}
              onPress={() => setFilter(btn.value)}
            >
              <Text
                className={`font-bold ${
                  filter === btn.value ? 'text-white' : 'text-gray-700'
                }`}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Agendamentos */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-gray-600 mt-4">Carregando agendamentos...</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {appointments.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-gray-800 text-lg font-bold mb-2 text-center">
                Nenhum agendamento encontrado
              </Text>
              <Text className="text-gray-500 text-center">
                {filter === 'all'
                  ? 'Ainda não há agendamentos registrados'
                  : `Nenhum agendamento ${filter}`}
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const statusInfo = getStatusInfo(appointment.status);
              return (
                <View key={appointment.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                  {/* Header do Card */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800 mb-2">
                        {appointment.service_name}
                      </Text>
                      <View
                        style={{ backgroundColor: statusInfo.bg }}
                        className="self-start px-3 py-1 rounded-full"
                      >
                        <Text style={{ color: statusInfo.color }} className="text-xs font-bold">
                          {statusInfo.icon} {statusInfo.text.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Informações do Agendamento */}
                  <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-3">👤</Text>
                      <Text className="text-gray-700 font-medium text-base">
                        {appointment.client_name}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-3">📞</Text>
                      <Text className="text-gray-700 font-medium text-base">
                        {appointment.client_phone}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-3">📅</Text>
                      <Text className="text-gray-700 font-medium text-base">
                        {format(parseISO(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">🕐</Text>
                      <Text className="text-gray-700 font-medium text-base">
                        {appointment.appointment_time.substring(0, 5)}
                      </Text>
                    </View>
                  </View>

                  {/* Ações */}
                  {appointment.status === 'pendente' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-green-50 border border-green-200 py-3 rounded-xl active:opacity-70"
                        activeOpacity={0.8}
                        onPress={() => handleUpdateStatus(appointment.id, 'realizado')}
                      >
                        <Text className="text-green-600 text-center font-bold">
                          ✅ Concluir
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-red-50 border border-red-200 py-3 rounded-xl active:opacity-70"
                        activeOpacity={0.8}
                        onPress={() => handleUpdateStatus(appointment.id, 'cancelado')}
                      >
                        <Text className="text-red-600 text-center font-bold">
                          ❌ Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {appointment.status !== 'pendente' && (
                    <TouchableOpacity
                      className="bg-gray-50 border border-gray-200 py-3 rounded-xl active:opacity-70"
                      activeOpacity={0.8}
                      onPress={() => handleUpdateStatus(appointment.id, 'pendente')}
                    >
                      <Text className="text-gray-600 text-center font-bold">
                        🔄 Marcar como Pendente
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          <View className="h-6" />
        </ScrollView>
      )}
    </View>
  );
}
