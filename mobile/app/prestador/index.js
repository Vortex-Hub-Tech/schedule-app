
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TenantStorage, DeviceStorage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors } from '../../utils/theme';

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

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');
  const logoUrl = tenant?.settings?.logoUrl;

  const menuItems = [
    {
      title: 'Gerenciar Serviços',
      description: 'Adicionar, editar e remover',
      icon: '📋',
      route: '/prestador/servicos',
      bgColor: colors.primary,
      emoji: '✨',
    },
    {
      title: 'Ver Agendamentos',
      description: 'Visualizar e gerenciar horários',
      icon: '📅',
      route: '/prestador/agendamentos',
      bgColor: '#6366f1',
      emoji: '📆',
    },
    {
      title: 'Relatórios',
      description: 'Analytics e métricas detalhadas',
      icon: '📊',
      route: '/prestador/relatorios',
      bgColor: '#8b5cf6',
      emoji: '📈',
    },
    {
      title: 'Configurações',
      description: 'Personalize cores e preferências',
      icon: '⚙️',
      route: '/prestador/configuracoes',
      bgColor: '#64748b',
      emoji: '🎨',
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-12 px-6 rounded-b-[32px] shadow-2xl"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="bg-white/20 w-20 h-20 rounded-3xl items-center justify-center border-2 border-white/30">
            {logoUrl ? (
              <Image 
                source={{ uri: logoUrl }} 
                className="w-16 h-16 rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-white text-4xl">💼</Text>
            )}
          </View>
          <TouchableOpacity
            className="bg-white/20 px-5 py-3 rounded-2xl border border-white/30"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm tracking-wide">Sair →</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-3xl font-bold mb-2 tracking-tight">
          Painel do Prestador
        </Text>
        <Text className="text-white/95 text-base font-medium">
          {tenant?.name || 'Gerencie seu negócio'}
        </Text>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Cards */}
        <View className="space-y-4 mt-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-3xl p-6 shadow-lg active:opacity-70 border border-gray-50"
              activeOpacity={0.8}
              onPress={() => router.push(item.route)}
              style={{
                shadowColor: item.bgColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Text className="text-3xl">{item.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-lg font-bold mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-gray-500 text-sm font-medium leading-5">
                    {item.description}
                  </Text>
                </View>
                <Text className="text-gray-400 text-2xl ml-2">→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View 
          style={{ backgroundColor: colors.light }} 
          className="rounded-3xl p-6 mt-6 mb-8 border border-gray-100"
        >
          <View className="flex-row items-start">
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-3xl">💡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-base mb-3">
                Dicas para Prestadores
              </Text>
              <View className="space-y-2">
                <Text className="text-gray-700 text-sm leading-6">
                  ✓ Mantenha seus serviços atualizados
                </Text>
                <Text className="text-gray-700 text-sm leading-6">
                  ✓ Responda aos agendamentos rapidamente
                </Text>
                <Text className="text-gray-700 text-sm leading-6">
                  ✓ Confirme os horários com antecedência
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
