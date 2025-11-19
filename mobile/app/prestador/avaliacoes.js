
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';
import { StarRatingDisplay } from '../../components/ui/StarRating';

export default function Avaliacoes() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);
      await loadFeedbacks();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const [feedbacksResponse, statsResponse] = await Promise.all([
        apiClient.feedbacks.getAll(),
        apiClient.feedbacks.getStats(),
      ]);
      setFeedbacks(feedbacksResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-4">Carregando avaliações...</Text>
      </View>
    );
  }

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-8 px-6 rounded-b-3xl">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">⭐ Avaliações</Text>
        <Text className="text-white/90 text-base">Feedback dos seus clientes</Text>
      </View>

      <ScrollView
        className="flex-1 px-6 -mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Estatísticas */}
        {stats && (
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 mb-4">📊 Resumo Geral</Text>
            
            <View className="items-center mb-6 pb-6 border-b border-gray-100">
              <Text className="text-6xl font-bold text-yellow-500 mb-2">
                {parseFloat(stats.average_rating || 0).toFixed(1)}
              </Text>
              <StarRatingDisplay rating={parseFloat(stats.average_rating || 0)} size={24} />
              <Text className="text-gray-500 mt-2">
                {stats.total_reviews} avaliações
              </Text>
            </View>

            {/* Distribuição */}
            <View className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = parseInt(stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star${star === 1 ? '' : 's'}`] || 0);
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                
                return (
                  <View key={star} className="flex-row items-center">
                    <Text className="text-gray-600 w-8">{star}⭐</Text>
                    <View className="flex-1 h-4 bg-gray-200 rounded-full mx-3 overflow-hidden">
                      <View
                        style={{ width: `${percentage}%`, backgroundColor: colors.primary }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <Text className="text-gray-600 w-8 text-right">{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Lista de Avaliações */}
        <Text className="text-xl font-bold text-gray-800 mb-4 px-1">💬 Comentários</Text>
        
        {feedbacks.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 items-center shadow-lg">
            <Text className="text-6xl mb-4">⭐</Text>
            <Text className="text-gray-800 text-xl font-bold mb-2 text-center">
              Nenhuma avaliação ainda
            </Text>
            <Text className="text-gray-500 text-center">
              Suas avaliações aparecerão aqui
            </Text>
          </View>
        ) : (
          <View className="space-y-3 mb-6">
            {feedbacks.map((feedback) => (
              <View key={feedback.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-800 font-bold text-base mb-1">
                      {feedback.client_name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {feedback.service_name}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                
                <StarRatingDisplay rating={feedback.rating} size={18} />
                
                {feedback.comment && (
                  <Text className="text-gray-700 mt-3 leading-5">
                    "{feedback.comment}"
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
