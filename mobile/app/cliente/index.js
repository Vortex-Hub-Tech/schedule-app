
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors } from '../../utils/theme';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { QuickAction } from '../../components/ui/QuickAction';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { StarRatingDisplay } from '../../components/ui/StarRating';
import { FavoritesStorage } from '../../utils/favorites';
import { useFocusEffect } from 'expo-router';

export default function ClienteHome() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const favs = await FavoritesStorage.getFavorites();
    setFavorites(favs);
  };

  const handleToggleFavorite = async (serviceId) => {
    await FavoritesStorage.toggleFavorite(serviceId);
    await loadFavorites();
  };

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    
    const cached = await TenantStorage.getCachedServices();
    if (cached && !cached.isStale) {
      setServices(cached.data);
      setLoading(false);
    }
    
    loadServices();
  };

  const loadServices = async () => {
    try {
      const response = await apiClient.services.getAll();
      setServices(response.data);
      await TenantStorage.cacheServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');
  const welcomeMessage = tenant?.settings?.welcomeMessage || 'Olá! 👋';
  const logoUrl = tenant?.settings?.logoUrl;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-16 pb-10 px-6 rounded-b-[32px] shadow-2xl"
        >
          <Text className="text-white text-3xl font-bold mb-2">
            Carregando...
          </Text>
        </LinearGradient>
        <View className="px-6 -mt-6">
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-10 px-6 rounded-b-[32px] shadow-2xl"
      >
        <View className="flex-row items-center justify-between mb-5">
          {logoUrl && (
            <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center border-2 border-white/30 mr-4">
              <Image 
                source={{ uri: logoUrl }} 
                className="w-14 h-14 rounded-xl"
                resizeMode="contain"
              />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white/90 text-sm font-semibold mb-1 tracking-wide">
              {welcomeMessage}
            </Text>
            <Text className="text-white text-3xl font-bold mt-1">
              Serviços Disponíveis
            </Text>
          </View>
        </View>
        <Text className="text-white/95 text-base font-medium leading-6">
          Escolha um serviço e faça seu agendamento de forma rápida e fácil
        </Text>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 mt-4 mb-6 shadow-lg">
          <Text className="text-gray-800 text-lg font-bold mb-4">Ações Rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
            <View className="flex-row space-x-4 px-2">
              <QuickAction
                icon="📅"
                label="Meus Agendamentos"
                onPress={() => router.push('/cliente/meus-agendamentos')}
                color="#0ea5e9"
              />
              <QuickAction
                icon="📊"
                label="Estatísticas"
                onPress={() => router.push('/cliente/estatisticas')}
                color="#8b5cf6"
              />
              <QuickAction
                icon="🕐"
                label="Histórico"
                onPress={() => router.push('/cliente/meus-agendamentos')}
                color="#10b981"
              />
              <QuickAction
                icon="⭐"
                label="Favoritos"
                onPress={() => router.push('/cliente/favoritos')}
                color="#f59e0b"
              />
            </View>
          </ScrollView>
        </View>

        {services.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg border border-gray-100">
            <Text className="text-7xl mb-5">😔</Text>
            <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
              Nenhum serviço disponível
            </Text>
            <Text className="text-gray-500 text-center text-base leading-6 px-4">
              Volte mais tarde para conferir novos serviços incríveis
            </Text>
          </View>
        ) : (
          <View className="mt-4 space-y-4">
            {services.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                className="bg-white rounded-3xl p-6 shadow-lg active:opacity-70 border border-gray-50"
                activeOpacity={0.8}
                onPress={() => router.push(`/cliente/agendar/${service.id}`)}
                style={{
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center mb-2">
                      <View 
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: colors.light }}
                      >
                        <Text className="text-2xl">✂️</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xl font-bold text-gray-800 mb-1 flex-1">
                            {service.name}
                          </Text>
                          <FavoriteButton
                            isFavorite={favorites.includes(service.id)}
                            onToggle={() => handleToggleFavorite(service.id)}
                            size={24}
                          />
                        </View>
                        <StarRatingDisplay rating={service.rating || 4.5} count={service.reviews_count || 0} size={14} />
                      </View>
                    </View>
                    {service.description && (
                      <Text className="text-gray-600 text-sm leading-6 mt-1">
                        {service.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
                  <View className="flex-row items-center space-x-3">
                    <View className="bg-gray-50 px-4 py-2.5 rounded-full flex-row items-center">
                      <Text className="text-base mr-1">⏱️</Text>
                      <Text className="text-gray-700 text-sm font-semibold">
                        {service.duration} min
                      </Text>
                    </View>
                  </View>
                  {service.price && (
                    <View style={{ backgroundColor: colors.light }} className="px-5 py-2.5 rounded-full">
                      <Text style={{ color: colors.primary }} className="text-lg font-bold">
                        R$ {parseFloat(service.price).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View 
                  style={{ backgroundColor: colors.primary }} 
                  className="mt-5 px-5 py-4 rounded-2xl items-center flex-row justify-center"
                >
                  <Text className="text-white font-bold text-base mr-2">
                    Agendar Agora
                  </Text>
                  <Text className="text-white text-lg">→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Floating Action Button */}
      <View className="px-6 pb-8 pt-4 bg-white/95 border-t border-gray-100">
        <TouchableOpacity 
          className="bg-gray-800 py-5 rounded-2xl flex-row items-center justify-center shadow-xl active:opacity-80"
          activeOpacity={0.8}
          onPress={() => router.push('/cliente/meus-agendamentos')}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-white text-xl font-bold mr-3">📅</Text>
          <Text className="text-white text-base font-bold tracking-wide">
            Meus Agendamentos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
