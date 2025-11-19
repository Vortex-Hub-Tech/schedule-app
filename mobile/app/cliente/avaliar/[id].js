
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../../config/api';
import { TenantStorage } from '../../../utils/storage';
import { getThemeColors } from '../../../utils/theme';
import { StarRating } from '../../../components/ui/StarRating';

export default function AvaliarServico() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // appointment_id
  const [tenant, setTenant] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);

      const appointmentResponse = await apiClient.appointments.getById(id);
      setAppointment(appointmentResponse.data);

      // Verificar se já existe avaliação
      try {
        const feedbackResponse = await apiClient.feedbacks.getByAppointment(id);
        setExistingFeedback(feedbackResponse.data);
        setRating(feedbackResponse.data.rating);
        setComment(feedbackResponse.data.comment || '');
      } catch (error) {
        // Sem avaliação ainda
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione uma avaliação');
      return;
    }

    setSubmitting(true);
    try {
      if (existingFeedback) {
        await apiClient.feedbacks.update(existingFeedback.id, { rating, comment });
        Alert.alert('✅ Sucesso!', 'Avaliação atualizada com sucesso', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await apiClient.feedbacks.create({
          appointment_id: id,
          rating,
          comment,
        });
        Alert.alert('✅ Obrigado!', 'Sua avaliação foi registrada com sucesso', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível enviar a avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-4">Carregando...</Text>
      </View>
    );
  }

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ backgroundColor: colors.primary }}
        className="pt-14 pb-8 px-6 rounded-b-3xl shadow-lg"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">
          {existingFeedback ? 'Editar Avaliação' : 'Avaliar Serviço'}
        </Text>
        <Text className="text-white/90 text-base">
          {appointment?.service_name}
        </Text>
      </View>

      <View className="px-6 -mt-4 pb-6">
        {/* Card de Avaliação */}
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <View className="items-center mb-6">
            <Text className="text-6xl mb-4">⭐</Text>
            <Text className="text-gray-800 font-bold text-lg mb-2">
              Como foi sua experiência?
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Sua opinião é muito importante para nós
            </Text>
            
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              editable={true}
              size={40}
            />
            
            {rating > 0 && (
              <Text className="text-gray-600 mt-3 font-semibold">
                {rating === 5 && '🤩 Excelente!'}
                {rating === 4 && '😊 Muito bom!'}
                {rating === 3 && '😐 Bom'}
                {rating === 2 && '😕 Pode melhorar'}
                {rating === 1 && '😞 Insatisfeito'}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Comentário (opcional)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800 min-h-[120px]"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            className="rounded-xl p-4 items-center"
            style={{
              backgroundColor: rating > 0 && !submitting ? colors.primary : '#9ca3af',
            }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {existingFeedback ? '✅ Atualizar Avaliação' : '✅ Enviar Avaliação'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações do Agendamento */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-gray-800 font-bold text-base mb-3">
            📋 Detalhes do Agendamento
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700">
              <Text className="font-semibold">Serviço:</Text> {appointment?.service_name}
            </Text>
            <Text className="text-gray-700">
              <Text className="font-semibold">Data:</Text>{' '}
              {new Date(appointment?.appointment_date).toLocaleDateString('pt-BR')}
            </Text>
            <Text className="text-gray-700">
              <Text className="font-semibold">Horário:</Text>{' '}
              {appointment?.appointment_time?.substring(0, 5)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
