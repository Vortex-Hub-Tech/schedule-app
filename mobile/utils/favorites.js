import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@agendafacil:favorites';

export const FavoritesStorage = {
  async getFavorites() {
    try {
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Erro ao obter favoritos:', error);
      return [];
    }
  },

  async addFavorite(serviceId) {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(serviceId)) {
        favorites.push(serviceId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
      return favorites;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      return favorites;
    }
  },

  async removeFavorite(serviceId) {
    try {
      const favorites = await this.getFavorites();
      const updated = favorites.filter((id) => id !== serviceId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return favorites;
    }
  },

  async isFavorite(serviceId) {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(serviceId);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  },

  async toggleFavorite(serviceId) {
    try {
      const isFav = await this.isFavorite(serviceId);
      if (isFav) {
        return await this.removeFavorite(serviceId);
      } else {
        return await this.addFavorite(serviceId);
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      return [];
    }
  },
};
