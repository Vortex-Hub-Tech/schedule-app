import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';
import { StatsCard } from '../../components/ui/StatsCard';

export default function PerfilPrestador() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-24 px-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-5" activeOpacity={0.7}>
          <View className="flex-row items-center bg-white/20 self-start px-4 py-2 rounded-xl">
            <Text className="text-white text-xl mr-2">←</Text>
            <Text className="text-white text-sm font-semibold">Voltar</Text>
          </View>
        </TouchableOpacity>
        <View className="items-center">
          <View className="bg-white w-24 h-24 rounded-3xl items-center justify-center mb-4">
            {tenant?.settings?.logoUrl ? (
              <Image
                source={{ uri: tenant.settings.logoUrl }}
                className="w-20 h-20 rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-5xl">👤</Text>
            )}
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {tenant?.name || 'Prestador'}
          </Text>
          <View className="bg-white/20 px-4 py-2 rounded-full mt-2">
            <Text className="text-white text-sm font-semibold">✅ Perfil Verificado</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 -mt-16" showsVerticalScrollIndicator={false}>
        {/* Informações */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-gray-800 mb-4">📋 Informações</Text>
          
          {tenant?.settings?.description && (
            <View className="mb-4">
              <Text className="text-gray-500 text-xs font-semibold mb-2">SOBRE</Text>
              <Text className="text-gray-700 text-base leading-6">
                {tenant.settings.description}
              </Text>
            </View>
          )}

          <View className="space-y-3">
            {tenant?.settings?.address && (
              <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
                <Text className="text-2xl mr-3">📍</Text>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1">ENDEREÇO</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {tenant.settings.address}
                  </Text>
                </View>
              </View>
            )}

            {tenant?.settings?.phone && (
              <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
                <Text className="text-2xl mr-3">📱</Text>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1">TELEFONE</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {tenant.settings.phone}
                  </Text>
                </View>
              </View>
            )}

            {tenant?.settings?.email && (
              <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
                <Text className="text-2xl mr-3">✉️</Text>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1">E-MAIL</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {tenant.settings.email}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Horário de Funcionamento */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-gray-800 mb-4">🕐 Horário de Funcionamento</Text>
          <View className="space-y-3">
            {['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'].map((day) => (
              <View key={day} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-gray-700 font-medium">{day}</Text>
                <Text className="text-gray-600">09:00 - 18:00</Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-700 font-medium">Domingo</Text>
              <Text className="text-red-600 font-semibold">Fechado</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 px-1">📊 Desempenho</Text>
          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <StatsCard
                icon="⭐"
                label="Avaliação"
                value="4.8"
                gradient={['#f59e0b', '#fbbf24']}
                description="média de 127 avaliações"
              />
            </View>
            <View className="flex-1">
              <StatsCard
                icon="✅"
                label="Atendimentos"
                value="356"
                gradient={['#10b981', '#34d399']}
                description="este mês"
              />
            </View>
          </View>
        </View>

        {/* Botões de Ação */}
        <View className="space-y-3 mb-8">
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
          >
            <Text className="text-white text-xl mr-2">✏️</Text>
            <Text className="text-white font-bold text-base">Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-800 py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
            onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento')}
          >
            <Text className="text-white text-xl mr-2">⚙️</Text>
            <Text className="text-white font-bold text-base">Configurações</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
