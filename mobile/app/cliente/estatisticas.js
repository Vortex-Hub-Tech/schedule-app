import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../config/api';
import { DeviceStorage, TenantStorage } from '../../utils/storage';
import { StatsCard } from '../../components/ui/StatsCard';
import { getThemeColors } from '../../utils/theme';

export default function Estatisticas() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    realizados: 0,
    cancelados: 0,
  });
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);

      const deviceId = await DeviceStorage.getDeviceId();
      const response = await apiClient.appointments.getAll({ deviceId });
      const appointments = response.data;

      const statsData = {
        total: appointments.length,
        pendentes: appointments.filter((a) => a.status === 'pendente').length,
        realizados: appointments.filter((a) => a.status === 'realizado').length,
        cancelados: appointments.filter((a) => a.status === 'cancelado').length,
      };

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
        className="pt-16 pb-10 px-6 rounded-b-[32px]"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-5" activeOpacity={0.7}>
          <View className="flex-row items-center bg-white/20 self-start px-4 py-2 rounded-xl">
            <Text className="text-white text-xl mr-2">←</Text>
            <Text className="text-white text-sm font-semibold">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-2">
          Minhas Estatísticas
        </Text>
        <Text className="text-white/95 text-base font-medium">
          Acompanhe seu histórico de agendamentos
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 -mt-6" showsVerticalScrollIndicator={false}>
        <View className="mt-4 space-y-4">
          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <StatsCard
                icon="📊"
                label="Total"
                value={stats.total}
                gradient={['#0ea5e9', '#38bdf8']}
                description="agendamentos"
              />
            </View>
            <View className="flex-1">
              <StatsCard
                icon="⏳"
                label="Pendentes"
                value={stats.pendentes}
                gradient={['#f59e0b', '#fbbf24']}
                description="aguardando"
              />
            </View>
          </View>

          <View className="flex-row space-x-4">
            <View className="flex-1">
              <StatsCard
                icon="✅"
                label="Realizados"
                value={stats.realizados}
                gradient={['#10b981', '#34d399']}
                description="concluídos"
              />
            </View>
            <View className="flex-1">
              <StatsCard
                icon="❌"
                label="Cancelados"
                value={stats.cancelados}
                gradient={['#ef4444', '#f87171']}
                description="não realizados"
              />
            </View>
          </View>

          {stats.total > 0 && (
            <View className="bg-white rounded-3xl p-6 mt-4">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                📈 Taxa de Conclusão
              </Text>
              <View className="bg-gray-100 h-4 rounded-full overflow-hidden">
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${(stats.realizados / stats.total) * 100}%`,
                  }}
                />
              </View>
              <Text className="text-gray-600 text-sm mt-3 text-center">
                {((stats.realizados / stats.total) * 100).toFixed(1)}% dos agendamentos foram realizados
              </Text>
            </View>
          )}

          {stats.total === 0 && !loading && (
            <View className="bg-white rounded-3xl p-10 mt-4 items-center">
              <Text className="text-7xl mb-4">📊</Text>
              <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
                Sem estatísticas ainda
              </Text>
              <Text className="text-gray-500 text-center mb-8 text-base leading-6">
                Faça seu primeiro agendamento para ver suas estatísticas aqui
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary }}
                className="px-8 py-4 rounded-2xl"
                onPress={() => router.push('/cliente')}
              >
                <Text className="text-white font-bold text-base">Agendar Serviço</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
