import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../../config/api';
import { TenantStorage } from '../../../utils/storage';

export default function ServicosLista() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    loadServices();
  };

  const loadServices = async () => {
    try {
      const response = await apiClient.services.getAll();
      setServices(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Remover Serviço',
      `Tem certeza que deseja remover "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.services.delete(id);
              loadServices();
              Alert.alert('Sucesso', 'Serviço removido');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o serviço');
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Meus Serviços</Text>
        <Text className="text-white/90">{services.length} serviço(s) cadastrado(s)</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4 pb-24">
        {services.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-gray-500 text-center text-base">
              Nenhum serviço cadastrado
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Comece adicionando seus serviços
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <View key={service.id} className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
              <View className="mb-4">
                <Text className="text-xl font-bold text-gray-800 mb-2">{service.name}</Text>
                {service.description && (
                  <Text className="text-gray-600 text-base leading-5">{service.description}</Text>
                )}
              </View>
              
              <View className="flex-row items-center pt-3 border-t border-gray-100 mb-4">
                <Text className="text-gray-500 mr-4 text-base">⏱️ {service.duration} min</Text>
                {service.price && (
                  <Text className={`${themeBg.replace('bg-', 'text-')} font-bold text-base`}>
                    R$ {parseFloat(service.price).toFixed(2)}
                  </Text>
                )}
              </View>
              
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 ${themeBg} py-3 rounded-lg`}
                  onPress={() => router.push(`/prestador/servicos/editar/${service.id}`)}
                >
                  <Text className="text-white text-center font-semibold">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-red-500 py-3 rounded-lg"
                  onPress={() => handleDelete(service.id, service.name)}
                >
                  <Text className="text-white text-center font-semibold">Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className={`${themeBg} py-4 rounded-xl shadow-lg`}
          onPress={() => router.push('/prestador/servicos/novo')}
        >
          <Text className="text-white text-center font-bold text-base">
            + Adicionar Serviço
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
