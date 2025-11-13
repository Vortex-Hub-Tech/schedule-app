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
      Alert.alert('Atenção', 'Preencha todos os campos');
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
        'Sucesso!',
        'Agendamento realizado com sucesso',
        [
          {
            text: 'Ver meus agendamentos',
            onPress: () => router.push('/cliente/meus-agendamentos'),
          },
          {
            text: 'Voltar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o agendamento');
    } finally {
      setLoading(false);
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

  if (!service) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">{service.name}</Text>
        <Text className="text-white/90">{service.description}</Text>
      </View>

      <View className="px-6 -mt-4 pb-6">
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-gray-800 font-bold text-lg mb-4">📝 Seus Dados</Text>
          
          <Text className="text-gray-700 font-semibold mb-2">Nome completo</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4 text-base"
            placeholder="Digite seu nome"
            value={clientName}
            onChangeText={setClientName}
            placeholderTextColor="#9ca3af"
          />

          <Text className="text-gray-700 font-semibold mb-2">Telefone (com DDD)</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base"
            placeholder="(00) 00000-0000"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-gray-800 font-bold text-lg mb-4">📅 Data e Hora</Text>
          
          <Text className="text-gray-700 font-semibold mb-2">Data do agendamento</Text>
          <TouchableOpacity
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-gray-800 text-base">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-700 font-semibold mb-2">Horário</Text>
          <TouchableOpacity
            className="bg-gray-50 border border-gray-300 rounded-lg p-4"
            onPress={() => setShowTimePicker(true)}
          >
            <Text className="text-gray-800 text-base">
              {format(selectedTime, 'HH:mm')}
            </Text>
          </TouchableOpacity>

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

        <TouchableOpacity
          className={`${themeBg} py-4 rounded-xl shadow-sm`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-base">
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
