import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import api from '../../config/api';

export default function PlanosScreen() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os planos');
    }
  };

  const loadCurrentPlan = async () => {
    try {
      const response = await api.get('/plans/current');
      setCurrentPlan(response.data.plan);
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId, planName) => {
    Alert.alert(
      'Alterar Plano',
      `Deseja alterar para o plano ${planName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSubscribing(true);
            try {
              await api.post(`/plans/subscribe/${planId}`);
              Alert.alert('Sucesso', 'Plano alterado com sucesso!');
              loadCurrentPlan();
            } catch (error) {
              console.error('Erro ao alterar plano:', error);
              Alert.alert('Erro', 'Não foi possível alterar o plano');
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const getPlanColor = (slug) => {
    const colors = {
      starter: '#6b7280',
      professional: '#8b5cf6',
      enterprise: '#10b981',
    };
    return colors[slug] || '#6b7280';
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Planos</Text>
        <Text className="text-gray-600 mb-6">
          Escolha o plano ideal para o seu negócio
        </Text>

        {currentPlan && (
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-sm text-gray-500 mb-2">Plano Atual</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {currentPlan.name}
            </Text>

            {usage && (
              <View className="space-y-3">
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Agendamentos este mês</Text>
                    <Text className="font-semibold text-gray-900">
                      {usage.appointments.unlimited
                        ? `${usage.appointments.used} (Ilimitado)`
                        : `${usage.appointments.used}/${usage.appointments.limit}`}
                    </Text>
                  </View>
                  {!usage.appointments.unlimited && (
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View
                        className="bg-sky-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (usage.appointments.used / usage.appointments.limit) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </View>
                  )}
                </View>

                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Prestadores</Text>
                    <Text className="font-semibold text-gray-900">
                      {usage.providers.unlimited
                        ? `${usage.providers.used} (Ilimitado)`
                        : `${usage.providers.used}/${usage.providers.limit}`}
                    </Text>
                  </View>
                  {!usage.providers.unlimited && (
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View
                        className="bg-sky-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (usage.providers.used / usage.providers.limit) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        <View className="space-y-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isProfessional = plan.slug === 'professional';
            const color = getPlanColor(plan.slug);

            return (
              <View
                key={plan.id}
                className={`rounded-xl p-6 ${
                  isProfessional ? 'bg-purple-600' : 'bg-white'
                } ${isProfessional ? 'shadow-lg' : 'shadow-sm'}`}
              >
                {isProfessional && (
                  <View className="bg-green-400 rounded-full px-4 py-1 self-start mb-4">
                    <Text className="text-white font-bold text-xs">MAIS POPULAR</Text>
                  </View>
                )}

                <Text
                  className={`text-2xl font-bold mb-2 ${
                    isProfessional ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </Text>

                <View className="flex-row items-baseline mb-4">
                  <Text
                    className={`text-sm ${
                      isProfessional ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    R$
                  </Text>
                  <Text
                    className={`text-5xl font-bold ${
                      isProfessional ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.price.toFixed(0)}
                  </Text>
                  <Text
                    className={`text-sm ml-1 ${
                      isProfessional ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    /mês
                  </Text>
                </View>

                <Text
                  className={`mb-6 ${
                    isProfessional ? 'text-purple-100' : 'text-gray-600'
                  }`}
                >
                  {plan.description}
                </Text>

                <View className="space-y-3 mb-6">
                  {plan.max_appointments_per_month !== null && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Até {plan.max_appointments_per_month} agendamentos/mês
                      </Text>
                    </View>
                  )}
                  {plan.max_appointments_per_month === null && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Agendamentos ilimitados
                      </Text>
                    </View>
                  )}

                  {plan.max_providers !== null && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        {plan.max_providers === 1
                          ? '1 prestador de serviço'
                          : `Até ${plan.max_providers} prestadores`}
                      </Text>
                    </View>
                  )}
                  {plan.max_providers === null && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Prestadores ilimitados
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center">
                    <Text
                      className={`text-lg mr-2 ${
                        isProfessional ? 'text-white' : 'text-green-500'
                      }`}
                    >
                      ✓
                    </Text>
                    <Text
                      className={isProfessional ? 'text-white' : 'text-gray-700'}
                    >
                      App mobile {plan.slug === 'starter' ? 'básico' : 'completo'}
                    </Text>
                  </View>

                  {plan.has_sms_notifications ? (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Notificações SMS
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-red-500">✗</Text>
                      <Text className="text-gray-500 line-through">
                        Notificações SMS
                      </Text>
                    </View>
                  )}

                  {plan.has_advanced_reports && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Relatórios avançados
                      </Text>
                    </View>
                  )}

                  {plan.has_priority_support && (
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg mr-2 ${
                          isProfessional ? 'text-white' : 'text-green-500'
                        }`}
                      >
                        ✓
                      </Text>
                      <Text
                        className={isProfessional ? 'text-white' : 'text-gray-700'}
                      >
                        Suporte prioritário
                      </Text>
                    </View>
                  )}

                  {plan.has_multi_units && (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-green-500">✓</Text>
                      <Text className="text-gray-700">Multi-unidades</Text>
                    </View>
                  )}

                  {plan.has_custom_api && (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-green-500">✓</Text>
                      <Text className="text-gray-700">API personalizada</Text>
                    </View>
                  )}

                  {plan.has_custom_integrations && (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-green-500">✓</Text>
                      <Text className="text-gray-700">Integrações customizadas</Text>
                    </View>
                  )}

                  {plan.has_dedicated_manager && (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-green-500">✓</Text>
                      <Text className="text-gray-700">Gerente de sucesso dedicado</Text>
                    </View>
                  )}

                  {plan.has_sla && (
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2 text-green-500">✓</Text>
                      <Text className="text-gray-700">SLA garantido</Text>
                    </View>
                  )}
                </View>

                {isCurrentPlan ? (
                  <View
                    className={`py-4 rounded-lg border-2 ${
                      isProfessional
                        ? 'border-white bg-purple-700'
                        : 'border-sky-500 bg-sky-50'
                    }`}
                  >
                    <Text
                      className={`text-center font-bold ${
                        isProfessional ? 'text-white' : 'text-sky-600'
                      }`}
                    >
                      Plano Atual
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className={`py-4 rounded-lg ${
                      isProfessional
                        ? 'bg-white'
                        : plan.price === 0
                        ? 'border-2 border-sky-500'
                        : 'bg-sky-500'
                    }`}
                    onPress={() => handleSubscribe(plan.id, plan.name)}
                    disabled={subscribing}
                  >
                    <Text
                      className={`text-center font-bold ${
                        isProfessional
                          ? 'text-purple-600'
                          : plan.price === 0
                          ? 'text-sky-600'
                          : 'text-white'
                      }`}
                    >
                      {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View className="mt-6 bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
          <Text className="text-sm text-amber-800 text-center">
            💡 Você pode alterar seu plano a qualquer momento
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
