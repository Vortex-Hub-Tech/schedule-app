
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';

export default function Configuracoes() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('sky');

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    setSelectedTheme(savedTenant?.settings?.theme || 'sky');
  };

  const updateTheme = async (theme) => {
    try {
      setSelectedTheme(theme);
      
      const updatedSettings = {
        ...tenant.settings,
        theme
      };

      await apiClient.patch('/tenants/settings', { settings: updatedSettings });
      
      const updatedTenant = {
        ...tenant,
        settings: updatedSettings
      };
      
      await TenantStorage.saveTenant(updatedTenant);
      setTenant(updatedTenant);
      
      Alert.alert('✅ Sucesso', 'Tema atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o tema');
    }
  };

  const colors = getThemeColors(selectedTheme);

  const themes = [
    { value: 'sky', name: 'Azul Céu', color: '#0ea5e9', emoji: '🌊' },
    { value: 'pink', name: 'Rosa', color: '#ec4899', emoji: '🌸' },
    { value: 'blue', name: 'Azul', color: '#3b82f6', emoji: '💙' },
    { value: 'orange', name: 'Laranja', color: '#f97316', emoji: '🔥' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-6 px-6 rounded-b-3xl shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-1">Configurações</Text>
        <Text className="text-white/90 text-base">Personalize seu app</Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4">
        {/* Informações da Empresa */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🏢 Informações da Empresa
          </Text>
          <View className="mb-4">
            <Text className="text-gray-600 mb-2">Nome da Empresa</Text>
            <Text className="text-lg font-bold text-gray-800">{tenant?.name}</Text>
          </View>
          <View className="mb-4">
            <Text className="text-gray-600 mb-2">ID do Tenant</Text>
            <Text className="text-sm text-gray-500 font-mono">{tenant?.id}</Text>
          </View>
          <View>
            <Text className="text-gray-600 mb-2">Plano</Text>
            <Text className="text-lg font-bold capitalize" style={{ color: colors.primary }}>
              {tenant?.plan}
            </Text>
          </View>
        </View>

        {/* Personalização de Cores */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🎨 Tema e Cores
          </Text>
          <Text className="text-gray-600 mb-4">
            Escolha a cor principal do seu app
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.value}
                onPress={() => updateTheme(theme.value)}
                className="flex-1"
                style={{ minWidth: '45%' }}
              >
                <View
                  style={{
                    backgroundColor: selectedTheme === theme.value ? theme.color : '#f3f4f6',
                    borderWidth: 2,
                    borderColor: selectedTheme === theme.value ? theme.color : 'transparent',
                  }}
                  className="p-4 rounded-xl items-center"
                >
                  <Text className="text-3xl mb-2">{theme.emoji}</Text>
                  <Text
                    className="font-bold"
                    style={{
                      color: selectedTheme === theme.value ? '#fff' : '#374151',
                    }}
                  >
                    {theme.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Segurança e Privacidade */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🔒 Segurança e Privacidade
          </Text>
          <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">✅</Text>
              <Text className="font-bold text-green-800">Dados Criptografados</Text>
            </View>
            <Text className="text-green-700 text-sm">
              Todas as informações são criptografadas em trânsito e em repouso
            </Text>
          </View>
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">🛡️</Text>
              <Text className="font-bold text-blue-800">Conformidade LGPD</Text>
            </View>
            <Text className="text-blue-700 text-sm">
              Sistema em conformidade com a Lei Geral de Proteção de Dados
            </Text>
          </View>
        </View>

        {/* Notificações */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🔔 Notificações
          </Text>
          <Text className="text-gray-600 mb-3">
            Lembretes automáticos são enviados 24h antes do agendamento
          </Text>
          <View className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">📱</Text>
              <Text className="font-bold text-purple-800">SMS Inteligentes</Text>
            </View>
            <Text className="text-purple-700 text-sm">
              Redução de até 80% em faltas com lembretes automáticos
            </Text>
          </View>
        </View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
