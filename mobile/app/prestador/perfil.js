
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';
import { StatsCard } from '../../components/ui/StatsCard';
import apiClient from '../../config/api';

export default function PerfilPrestador() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState({
    totalAgendamentos: 0,
    agendamentosPendentes: 0,
    agendamentosRealizados: 0,
    totalServicos: 0,
    receitaMensal: 0,
    avaliacaoMedia: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);
      await loadStats();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const [appointmentsResponse, servicesResponse, feedbackStats] = await Promise.all([
        apiClient.appointments.getAll(),
        apiClient.services.getAll(),
        apiClient.feedbacks.getStats(),
      ]);

      const appointments = appointmentsResponse.data;
      const services = servicesResponse.data;

      // Calcular estatísticas
      const totalAgendamentos = appointments.length;
      const agendamentosPendentes = appointments.filter(a => a.status === 'pendente').length;
      const agendamentosRealizados = appointments.filter(a => a.status === 'realizado').length;
      const totalServicos = services.length;

      // Calcular receita do mês atual
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const receitaMensal = appointments
        .filter(a => {
          const date = new Date(a.appointment_date);
          return a.status === 'realizado' && 
                 date.getMonth() === currentMonth && 
                 date.getFullYear() === currentYear;
        })
        .reduce((sum, a) => {
          const service = services.find(s => s.name === a.service_name);
          return sum + (service?.price ? parseFloat(service.price) : 0);
        }, 0);

      setStats({
        totalAgendamentos,
        agendamentosPendentes,
        agendamentosRealizados,
        totalServicos,
        receitaMensal,
        avaliacaoMedia: parseFloat(feedbackStats.data?.average_rating || 0),
        totalAvaliacoes: parseInt(feedbackStats.data?.total_reviews || 0),
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleEditProfile = () => {
    router.push('/prestador/configuracoes');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-4 text-base">Carregando perfil...</Text>
      </View>
    );
  }

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
          <View className="bg-white w-24 h-24 rounded-3xl items-center justify-center mb-4 shadow-lg">
            {tenant?.settings?.logoUrl ? (
              <Image
                source={{ uri: tenant.settings.logoUrl }}
                className="w-20 h-20 rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-5xl">💼</Text>
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

      <ScrollView 
        className="flex-1 px-6 -mt-16" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Estatísticas Principais */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 px-1">📊 Desempenho</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%]">
              <StatsCard
                icon="⭐"
                label="Avaliação"
                value={stats.avaliacaoMedia > 0 ? stats.avaliacaoMedia.toFixed(1) : '-'}
                gradient={['#f59e0b', '#fbbf24']}
                description={`${stats.totalAvaliacoes} avaliações`}
              />
            </View>
            <View className="flex-1 min-w-[45%]">
              <StatsCard
                icon="✅"
                label="Realizados"
                value={stats.agendamentosRealizados}
                gradient={['#10b981', '#34d399']}
                description="este mês"
              />
            </View>
            <View className="flex-1 min-w-[45%]">
              <StatsCard
                icon="⏳"
                label="Pendentes"
                value={stats.agendamentosPendentes}
                gradient={['#f97316', '#fb923c']}
                description="aguardando"
              />
            </View>
            <View className="flex-1 min-w-[45%]">
              <StatsCard
                icon="💰"
                label="Receita Mensal"
                value={`R$ ${stats.receitaMensal.toFixed(0)}`}
                gradient={['#8b5cf6', '#a78bfa']}
                description="este mês"
              />
            </View>
          </View>
        </View>

        {/* Informações da Empresa */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-gray-800 mb-4">🏢 Informações da Empresa</Text>
          
          {tenant?.settings?.description && (
            <View className="mb-4 pb-4 border-b border-gray-100">
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

            <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
              <Text className="text-2xl mr-3">📋</Text>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs font-semibold mb-1">SERVIÇOS CADASTRADOS</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  {stats.totalServicos} serviço(s) ativo(s)
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 rounded-2xl" style={{ backgroundColor: colors.light }}>
              <Text className="text-2xl mr-3">💎</Text>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs font-semibold mb-1">PLANO ATUAL</Text>
                <Text className="text-gray-800 text-base font-bold capitalize">
                  {tenant?.plan || 'Básico'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Horário de Funcionamento */}
        {tenant?.settings?.workingHours && (
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
            <Text className="text-xl font-bold text-gray-800 mb-4">🕐 Horário de Funcionamento</Text>
            <View className="space-y-3">
              {Object.entries(tenant.settings.workingHours).map(([day, hours]) => (
                <View key={day} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                  <Text className="text-gray-700 font-medium capitalize">{day}</Text>
                  <Text className={hours === 'Fechado' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {hours}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resumo de Atividades */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-gray-800 mb-4">📈 Resumo de Atividades</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center p-4 bg-blue-50 rounded-xl">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">📅</Text>
                <Text className="text-gray-700 font-medium">Total de Agendamentos</Text>
              </View>
              <Text className="text-blue-600 font-bold text-lg">{stats.totalAgendamentos}</Text>
            </View>
            
            <View className="flex-row justify-between items-center p-4 bg-green-50 rounded-xl">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">✅</Text>
                <Text className="text-gray-700 font-medium">Taxa de Conclusão</Text>
              </View>
              <Text className="text-green-600 font-bold text-lg">
                {stats.totalAgendamentos > 0 
                  ? ((stats.agendamentosRealizados / stats.totalAgendamentos) * 100).toFixed(0)
                  : 0}%
              </Text>
            </View>

            <View className="flex-row justify-between items-center p-4 bg-purple-50 rounded-xl">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-3">💼</Text>
                <Text className="text-gray-700 font-medium">Serviços Oferecidos</Text>
              </View>
              <Text className="text-purple-600 font-bold text-lg">{stats.totalServicos}</Text>
            </View>
          </View>
        </View>

        {/* Botões de Ação */}
        <View className="space-y-3 mb-8">
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
            onPress={handleEditProfile}
          >
            <Text className="text-white text-xl mr-2">⚙️</Text>
            <Text className="text-white font-bold text-base">Editar Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-800 py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
            onPress={() => router.push('/prestador/servicos')}
          >
            <Text className="text-white text-xl mr-2">📋</Text>
            <Text className="text-white font-bold text-base">Gerenciar Serviços</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-2 py-5 rounded-2xl flex-row items-center justify-center"
            style={{ borderColor: colors.primary }}
            onPress={() => router.push('/prestador/agendamentos')}
          >
            <Text className="text-xl mr-2" style={{ color: colors.primary }}>📅</Text>
            <Text className="font-bold text-base" style={{ color: colors.primary }}>
              Ver Agendamentos
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
