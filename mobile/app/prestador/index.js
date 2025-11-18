import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage, DeviceStorage } from '../../utils/storage';

export default function PrestadorHome() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
  };

  const handleLogout = async () => {
    await DeviceStorage.clearUserSession();
    router.replace('/');
  };

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'pink':
        return { primary: '#ec4899', light: '#fce7f3' };
      case 'blue':
        return { primary: '#3b82f6', light: '#dbeafe' };
      case 'orange':
        return { primary: '#f97316', light: '#ffedd5' };
      default:
        return { primary: '#0ea5e9', light: '#e0f2fe' };
    }
  };

  const colors = getThemeColor(tenant?.settings?.theme);

  const menuItems = [
    {
      title: 'Meus Serviços',
      description: 'Adicione, edite ou remova serviços',
      icon: '📋',
      route: '/prestador/servicos',
      color: colors.primary,
    },
    {
      title: 'Agendamentos',
      description: 'Visualize e gerencie horários marcados',
      icon: '📅',
      route: '/prestador/agendamentos',
      color: '#6366f1',
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-10 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View className="bg-white/20 w-16 h-16 rounded-full items-center justify-center">
            <Text className="text-white text-3xl">💼</Text>
          </View>
          <TouchableOpacity
            className="bg-white/20 px-4 py-2 rounded-full"
            onPress={handleLogout}
          >
            <Text className="text-white font-semibold text-sm">Sair</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-3xl font-bold mb-1">
          Painel do Prestador
        </Text>
        <Text className="text-white/90 text-base">
          {tenant?.name || 'Gerencie seu negócio'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 -mt-4">
        {/* Cards de Menu */}
        <View className="px-6">
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-row items-center justify-between p-5 rounded-2xl mb-4 shadow-sm active:opacity-80"
            activeOpacity={0.8}
            onPress={() => router.push('/prestador/servicos')}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">📋</Text>
              <View>
                <Text className="text-white text-lg font-bold mb-1">
                  Gerenciar Serviços
                </Text>
                <Text className="text-white/80 text-sm">
                  Adicionar, editar e remover serviços
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-row items-center justify-between p-5 rounded-2xl mb-4 shadow-sm active:opacity-80"
            activeOpacity={0.8}
            onPress={() => router.push('/prestador/agendamentos')}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">📅</Text>
              <View>
                <Text className="text-white text-lg font-bold mb-1">
                  Ver Agendamentos
                </Text>
                <Text className="text-white/80 text-sm">
                  Visualizar e gerenciar horários
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-row items-center justify-between p-5 rounded-2xl mb-4 shadow-sm active:opacity-80"
            activeOpacity={0.8}
            onPress={() => router.push('/prestador/relatorios')}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">📊</Text>
              <View>
                <Text className="text-white text-lg font-bold mb-1">
                  Relatórios
                </Text>
                <Text className="text-white/80 text-sm">
                  Analytics e métricas detalhadas
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-row items-center justify-between p-5 rounded-2xl shadow-sm active:opacity-80"
            activeOpacity={0.8}
            onPress={() => router.push('/prestador/configuracoes')}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">⚙️</Text>
              <View>
                <Text className="text-white text-lg font-bold mb-1">
                  Configurações
                </Text>
                <Text className="text-white/80 text-sm">
                  Personalize cores e preferências
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl">→</Text>
          </TouchableOpacity>
        </View>

        {/* Card Informativo */}
        <View style={{ backgroundColor: colors.light }} className="rounded-2xl p-6 mb-6">
          <View className="flex-row items-start">
            <Text className="text-3xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-base mb-2">
                Dicas para Prestadores
              </Text>
              <Text className="text-gray-600 text-sm leading-5">
                • Mantenha seus serviços atualizados{'\n'}
                • Responda aos agendamentos rapidamente{'\n'}
                • Confirme os horários com antecedência
              </Text>
            </View>
          </View>
        </View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}