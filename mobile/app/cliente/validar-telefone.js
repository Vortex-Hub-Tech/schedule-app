
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../config/api';
import { getThemeColors } from '../../utils/theme';

export default function ValidarTelefone() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phone, serviceId } = params;
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const colors = getThemeColors();

  const sendCode = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Erro', 'Número de telefone inválido');
      return;
    }

    setSendingCode(true);
    try {
      await api.validation.sendCode(phone);
      setCodeSent(true);
      Alert.alert(
        'Código Enviado! ✅',
        'Verifique seu WhatsApp e digite o código de 6 dígitos que você recebeu.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Não foi possível enviar o código. Tente novamente.'
      );
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Erro', 'Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await api.validation.verifyCode(phone, code);
      Alert.alert(
        'Verificado! ✅',
        'Seu telefone foi confirmado com sucesso.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              router.push({
                pathname: '/cliente/agendar/[id]',
                params: { id: serviceId, phone, verified: 'true' }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      Alert.alert(
        'Código Inválido',
        error.response?.data?.error || 'Código incorreto ou expirado. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6">
      <View className="bg-white rounded-2xl p-6 shadow-sm">
        <View className="items-center mb-6">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-4xl">📱</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            Validar Telefone
          </Text>
          <Text className="text-gray-600 text-center">
            Confirme seu número para continuar
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Telefone:</Text>
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-lg font-medium text-gray-800">{phone}</Text>
          </View>
        </View>

        {!codeSent ? (
          <TouchableOpacity
            onPress={sendCode}
            disabled={sendingCode}
            className="rounded-xl p-4 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            {sendingCode ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Enviar Código via WhatsApp
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <Text className="text-gray-700 font-semibold mb-2">
              Digite o código de 6 dígitos:
            </Text>
            <TextInput
              className="bg-white border-2 rounded-xl p-4 mb-4 text-center text-2xl font-bold tracking-widest"
              style={{ borderColor: colors.primary }}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#ccc"
            />

            <TouchableOpacity
              onPress={verifyCode}
              disabled={loading || code.length !== 6}
              className="rounded-xl p-4 items-center mb-3"
              style={{ 
                backgroundColor: code.length === 6 ? colors.primary : '#ccc'
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Verificar Código
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={sendCode}
              disabled={sendingCode}
              className="p-3 items-center"
            >
              <Text style={{ color: colors.primary }} className="font-semibold">
                {sendingCode ? 'Enviando...' : 'Reenviar Código'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 p-3 items-center"
        >
          <Text className="text-gray-500">Voltar</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6 bg-blue-50 p-4 rounded-xl">
        <Text className="text-blue-800 text-center text-sm">
          💡 Você receberá uma mensagem no WhatsApp com o código de verificação
        </Text>
      </View>
    </View>
  );
}
