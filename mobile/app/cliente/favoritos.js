import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { FavoritesStorage } from '../../utils/favorites';
import { getThemeColors } from '../../utils/theme';
import { FavoriteButton } from '../../components/ui/FavoriteButton';
import { useFocusEffect } from 'expo-router';

export default function Favoritos() {
  const router = useRouter();
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setRefreshing(true);
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);

      const favoriteIds = await FavoritesStorage.getFavorites();
      
      if (favoriteIds.length === 0) {
        setFavoriteServices([]);
        return;
      }

      const response = await apiClient.services.getAll();
      const allServices = response.data;

      const favorites = allServices.filter((service) =>
        favoriteIds.includes(service.id)
      );

      setFavoriteServices(favorites);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavoriteServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleToggleFavorite = async (serviceId) => {
    await FavoritesStorage.toggleFavorite(serviceId);
    loadFavorites();
  };

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-10 px-6 rounded-b-[32px]"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-5" activeOpacity={0.7}>
          <View className="flex-row items-center bg-white/20 self-start px-4 py-2 rounded-xl">
            <Text className="text-white text-xl mr-2">←</Text>
            <Text className="text-white text-sm font-semibold">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-2">⭐ Favoritos</Text>
        <Text className="text-white/95 text-base font-medium">
          Seus serviços preferidos
        </Text>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {favoriteServices.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 mt-4 items-center shadow-lg">
            <Text className="text-7xl mb-5">⭐</Text>
            <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
              Nenhum favorito ainda
            </Text>
            <Text className="text-gray-500 text-center mb-8 text-base leading-6">
              Adicione serviços aos favoritos para acessá-los rapidamente
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="px-8 py-4 rounded-2xl"
              onPress={() => router.push('/cliente')}
            >
              <Text className="text-white font-bold text-base">Ver Serviços</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-4 space-y-4">
            {favoriteServices.map((service) => (
              <View
                key={service.id}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-50"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-3">
                    <Text className="text-xl font-bold text-gray-800 mb-2">
                      {service.name}
                    </Text>
                    {service.description && (
                      <Text className="text-gray-600 text-sm leading-6">
                        {service.description}
                      </Text>
                    )}
                  </View>
                  <FavoriteButton
                    isFavorite={true}
                    onToggle={() => handleToggleFavorite(service.id)}
                    size={28}
                  />
                </View>

                <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
                  <View className="bg-gray-50 px-4 py-2.5 rounded-full flex-row items-center">
                    <Text className="text-base mr-1">⏱️</Text>
                    <Text className="text-gray-700 text-sm font-semibold">
                      {service.duration} min
                    </Text>
                  </View>
                  {service.price && (
                    <View style={{ backgroundColor: colors.light }} className="px-5 py-2.5 rounded-full">
                      <Text style={{ color: colors.primary }} className="text-lg font-bold">
                        R$ {parseFloat(service.price).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={{ backgroundColor: colors.primary }}
                  className="mt-5 px-5 py-4 rounded-2xl items-center flex-row justify-center"
                  onPress={() => router.push(`/cliente/agendar/${service.id}`)}
                >
                  <Text className="text-white font-bold text-base mr-2">Agendar Agora</Text>
                  <Text className="text-white text-lg">→</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
