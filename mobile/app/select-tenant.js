import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../config/api';
import { TenantStorage } from '../utils/storage';

export default function SelectTenant() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants(tenants);
    }
  }, [searchQuery, tenants]);

  const loadTenants = async () => {
    try {
      const response = await apiClient.tenants.getAll();
      setTenants(response.data);
      setFilteredTenants(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenant) => {
    try {
      setLoading(true);
      
      await TenantStorage.setTenant(tenant);
      
      const bootstrap = await apiClient.tenants.getBootstrap(tenant.id);
      await TenantStorage.setTenantData(bootstrap.data);
      
      router.replace('/');
    } catch (error) {
      console.error('Erro ao selecionar empresa:', error);
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

  if (loading && tenants.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-4">Carregando empresas...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary-600 pt-12 pb-8 px-6">
        <Text className="text-white text-3xl font-bold mb-2">
          Bem-vindo!
        </Text>
        <Text className="text-primary-100 text-base">
          Selecione a empresa para continuar
        </Text>
      </View>

      <View className="px-6 -mt-4 mb-4">
        <TextInput
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          placeholder="Buscar empresa..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <ScrollView className="flex-1 px-6">
        {filteredTenants.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-gray-500 text-center text-base">
              {searchQuery ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa disponível'}
            </Text>
          </View>
        ) : (
          filteredTenants.map((tenant) => (
            <TouchableOpacity
              key={tenant.id}
              className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100"
              onPress={() => selectTenant(tenant)}
              disabled={loading}
            >
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full ${getThemeColor(tenant.settings?.theme)} justify-center items-center mr-4`}>
                  <Text className="text-white text-xl font-bold">
                    {tenant.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {tenant.name}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-0.5 capitalize">
                    Plano {tenant.plan}
                  </Text>
                </View>

                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-600 text-xs font-medium">
                    Selecionar
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {loading && tenants.length > 0 && (
        <View className="absolute inset-0 bg-black/20 justify-center items-center">
          <View className="bg-white rounded-lg p-6">
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text className="text-gray-700 mt-3">Carregando...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
