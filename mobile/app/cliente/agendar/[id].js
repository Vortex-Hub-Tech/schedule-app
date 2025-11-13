import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '../../../config/api';
import { TenantStorage, DeviceStorage } from '../../../utils/storage';

export default function AgendarServico() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [service, setService] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    
    const id = await DeviceStorage.getDeviceId();
    setDeviceId(id);
    
    loadService();
  };

  const loadService = async () => {
    try {
      const response = await apiClient.services.getById(id);
      setService(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o serviço');
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!deviceId) {
      Alert.alert('Erro', 'Erro de autenticação. Tente reiniciar o aplicativo.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.appointments.create({
        service_id: id,
        client_name: clientName,
        client_phone: clientPhone,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: format(selectedTime, 'HH:mm'),
        device_id: deviceId,
      });
      
      Alert.alert(
        '✅ Agendamento Confirmado!',
        'Seu horário foi reservado com sucesso.',
        [
          {
            text: 'Ver meus agendamentos',
            onPress: () => router.push('/cliente/meus-agendamentos'),
          },
          {
            text: 'Voltar ao início',
            onPress: () => router.push('/cliente'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o agendamento. Tente novamente.');
    } finally {
      setLoading(false);
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

  if (!service) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Carregando serviço...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-8 px-6 rounded-b-3xl shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">{service.name}</Text>
        <Text className="text-white/90 text-base">{service.description}</Text>
        
        {/* Info do Serviço */}
        <View className="flex-row items-center mt-4 space-x-4">
          <View className="bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-white font-medium">⏱️ {service.duration} min</Text>
          </View>
          {service.price && (
            <View className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">R$ {parseFloat(service.price).toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-6 -mt-4 pb-6">
        {/* Seus Dados */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl mr-2">📝</Text>
            <Text className="text-gray-800 font-bold text-lg">Seus Dados</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Nome completo *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
              placeholder="Digite seu nome completo"
              value={clientName}
              onChangeText={setClientName}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View>
            <Text className="text-gray-700 font-semibold mb-2">Telefone (com DDD) *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
              placeholder="(00) 00000-0000"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Data e Hora */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl mr-2">📅</Text>
            <Text className="text-gray-800 font-bold text-lg">Data e Hora</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Data do agendamento</Text>
            <TouchableOpacity
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-gray-800 text-base font-medium">
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              <Text className="text-gray-400 text-xl">📅</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-gray-700 font-semibold mb-2">Horário</Text>
            <TouchableOpacity
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-gray-800 text-base font-medium">
                {format(selectedTime, 'HH:mm')}
              </Text>
              <Text className="text-gray-400 text-xl">🕐</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setSelectedDate(date);
              }}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (time) setSelectedTime(time);
              }}
            />
          )}
        </View>

        {/* Resumo */}
        <View style={{ backgroundColor: colors.light }} className="rounded-2xl p-5 mb-4">
          <Text className="text-gray-800 font-bold text-base mb-3">📋 Resumo do Agendamento</Text>
          <View className="space-y-2">
            <Text className="text-gray-700">
              <Text className="font-semibold">Serviço:</Text> {service.name}
            </Text>
            <Text className="text-gray-700">
              <Text className="font-semibold">Data:</Text> {format(selectedDate, "dd/MM/yyyy")}
            </Text>
            <Text className="text-gray-700">
              <Text className="font-semibold">Horário:</Text> {format(selectedTime, 'HH:mm')}
            </Text>
            <Text className="text-gray-700">
              <Text className="font-semibold">Duração:</Text> {service.duration} minutos
            </Text>
          </View>
        </View>

        {/* Botão Confirmar */}
        <TouchableOpacity
          style={{ backgroundColor: loading ? '#9ca3af' : colors.primary }}
          className="py-4 rounded-2xl shadow-lg active:opacity-80"
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-base">
            {loading ? 'Agendando...' : '✓ Confirmar Agendamento'}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs text-center mt-4">
          * Campos obrigatórios
        </Text>
      </View>
    </ScrollView>
  );
}
