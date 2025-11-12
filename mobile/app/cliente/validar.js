import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';

export default function ValidarCodigo() {
  const router = useRouter();
  const { serviceId, clientName, clientPhone, date, time } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await apiClient.validation.verifyCode(clientPhone, code);
      
      await apiClient.appointments.create({
        service_id: serviceId,
        client_name: clientName,
        client_phone: clientPhone,
        appointment_date: date,
        appointment_time: time,
      });

      Alert.alert(
        'Sucesso! ✅',
        'Seu agendamento foi confirmado!',
        [{ text: 'OK', onPress: () => router.push('/cliente') }]
      );
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.error || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.validation.sendCode(clientPhone);
      Alert.alert('Sucesso', 'Código reenviado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reenviar o código');
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
        <Text className="text-white text-2xl font-bold mb-1">Validação</Text>
        <Text className="text-white/90">Digite o código recebido</Text>
      </View>

      <View className="px-6 -mt-4">
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-gray-100 rounded-full justify-center items-center mb-4">
              <Text className="text-4xl">📱</Text>
            </View>
            <Text className="text-gray-600 text-center text-base">
              Digite o código de 6 dígitos enviado para
            </Text>
            <Text className={`${themeBg.replace('bg-', 'text-')} font-bold text-base mt-1`}>
              {clientPhone}
            </Text>
          </View>

          <TextInput
            className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-center text-3xl font-bold tracking-widest mb-5"
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#cbd5e1"
          />

          <TouchableOpacity
            className={`${themeBg} py-4 rounded-xl mb-4 shadow-sm`}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-base">
              {loading ? 'Verificando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} className="py-3">
            <Text className={`${themeBg.replace('bg-', 'text-')} text-center font-semibold`}>
              Reenviar código
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
