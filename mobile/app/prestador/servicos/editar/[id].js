import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import apiClient from '../../../../config/api';
import { TenantStorage } from '../../../../utils/storage';

export default function EditarServico() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    loadService();
  };

  const loadService = async () => {
    try {
      const response = await apiClient.services.getById(id);
      const service = response.data;
      setName(service.name);
      setDescription(service.description || '');
      setDuration(service.duration.toString());
      setPrice(service.price ? service.price.toString() : '');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o serviço');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !duration.trim()) {
      Alert.alert('Atenção', 'Preencha pelo menos o nome e duração');
      return;
    }

    setSaving(true);
    try {
      await apiClient.services.update(id, {
        name: name.trim(),
        description: description.trim() || null,
        duration: parseInt(duration),
        price: price ? parseFloat(price) : null,
        available_days: ['segunda', 'terça', 'quarta', 'quinta', 'sexta'],
        available_hours: { start: '09:00', end: '18:00' },
      });

      Alert.alert('Sucesso ✅', 'Serviço atualizado!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o serviço');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-500 mt-4">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${themeBg} pt-12 pb-8 px-6`}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Editar Serviço</Text>
        <Text className="text-white/90">Atualize os dados do serviço</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4 pb-6">
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-gray-700 font-bold mb-2">Nome do Serviço *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base"
            placeholder="Ex: Corte de Cabelo"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
          <Text className="text-gray-700 font-bold mb-2">Descrição</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base"
            placeholder="Descreva o serviço..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm">
            <Text className="text-gray-700 font-bold mb-2">Duração (min) *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base"
              placeholder="Ex: 60"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm">
            <Text className="text-gray-700 font-bold mb-2">Preço (R$)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base"
              placeholder="Ex: 50.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <TouchableOpacity
          className={`${themeBg} py-4 rounded-xl shadow-sm`}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text className="text-white text-center font-bold text-base">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
