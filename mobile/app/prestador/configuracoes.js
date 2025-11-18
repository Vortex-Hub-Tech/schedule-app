
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import apiClient from '../../config/api';
import { TenantStorage } from '../../utils/storage';
import { getThemeColors } from '../../utils/theme';

export default function Configuracoes() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [settings, setSettings] = useState({
    theme: 'sky',
    welcomeMessage: 'Bem-vindo!',
    enableNotifications: true,
    enableReminders: true,
    reminderHours: 24,
    logoUrl: '',
    accentColor: '#38bdf8',
    backgroundStyle: 'gradient',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    const savedTenant = await TenantStorage.getTenant();
    setTenant(savedTenant);
    
    if (savedTenant?.settings) {
      setSettings({
        theme: savedTenant.settings.theme || 'sky',
        welcomeMessage: savedTenant.settings.welcomeMessage || 'Bem-vindo!',
        enableNotifications: savedTenant.settings.enableNotifications ?? true,
        enableReminders: savedTenant.settings.enableReminders ?? true,
        reminderHours: savedTenant.settings.reminderHours || 24,
        logoUrl: savedTenant.settings.logoUrl || '',
        accentColor: savedTenant.settings.accentColor || '#38bdf8',
        backgroundStyle: savedTenant.settings.backgroundStyle || 'gradient',
      });
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...tenant.settings,
        ...settings,
      };

      const response = await apiClient.tenants.updateSettings(updatedSettings);
      
      const updatedTenant = {
        ...tenant,
        settings: response.data.settings,
      };
      
      await TenantStorage.setTenant(updatedTenant);
      setTenant(updatedTenant);
      
      Alert.alert('✅ Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('❌ Erro', 'Não foi possível salvar as configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const colors = getThemeColors(settings.theme);

  const themes = [
    { value: 'sky', name: 'Azul Céu', color: '#0ea5e9', emoji: '🌊', gradient: ['#0ea5e9', '#38bdf8'] },
    { value: 'pink', name: 'Rosa', color: '#ec4899', emoji: '🌸', gradient: ['#ec4899', '#f472b6'] },
    { value: 'blue', name: 'Azul', color: '#3b82f6', emoji: '💙', gradient: ['#3b82f6', '#60a5fa'] },
    { value: 'orange', name: 'Laranja', color: '#f97316', emoji: '🔥', gradient: ['#f97316', '#fb923c'] },
    { value: 'green', name: 'Verde', color: '#10b981', emoji: '🍀', gradient: ['#10b981', '#34d399'] },
    { value: 'purple', name: 'Roxo', color: '#8b5cf6', emoji: '💜', gradient: ['#8b5cf6', '#a78bfa'] },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }} className="pt-14 pb-6 px-6 shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl mr-2">←</Text>
            <Text className="text-white text-base font-medium">Voltar</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-1">⚙️ Configurações</Text>
        <Text className="text-white/90 text-base">Personalize seu app</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Informações da Empresa */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🏢 Informações da Empresa
          </Text>
          <View className="mb-3">
            <Text className="text-gray-600 text-sm mb-1">Nome da Empresa</Text>
            <Text className="text-lg font-bold text-gray-800">{tenant?.name}</Text>
          </View>
          <View className="mb-3">
            <Text className="text-gray-600 text-sm mb-1">Plano Atual</Text>
            <View className="bg-gradient-to-r p-3 rounded-xl" style={{ backgroundColor: colors.light }}>
              <Text className="text-lg font-bold capitalize" style={{ color: colors.text }}>
                {tenant?.plan}
              </Text>
            </View>
          </View>
        </View>

        {/* Logo da Empresa */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🖼️ Logo da Empresa
          </Text>
          <Text className="text-gray-600 text-sm mb-3">
            URL da imagem do seu logo (opcional)
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
            value={settings.logoUrl}
            onChangeText={(text) => updateSetting('logoUrl', text)}
            placeholder="https://exemplo.com/logo.png"
            autoCapitalize="none"
            keyboardType="url"
          />
          {settings.logoUrl ? (
            <View className="mt-3 items-center">
              <Text className="text-green-600 text-sm mb-2">✓ Logo configurado</Text>
            </View>
          ) : null}
        </View>

        {/* Mensagem de Boas-vindas */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            👋 Mensagem de Boas-vindas
          </Text>
          <Text className="text-gray-600 text-sm mb-3">
            Personalize a mensagem que seus clientes verão
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
            value={settings.welcomeMessage}
            onChangeText={(text) => updateSetting('welcomeMessage', text)}
            placeholder="Ex: Bem-vindo ao nosso salão!"
            maxLength={100}
          />
          <Text className="text-gray-400 text-xs mt-2 text-right">
            {settings.welcomeMessage.length}/100 caracteres
          </Text>
        </View>

        {/* Tema e Cores */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🎨 Tema e Cores
          </Text>
          <Text className="text-gray-600 text-sm mb-4">
            Escolha a cor que representa sua marca
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.value}
                onPress={() => updateSetting('theme', theme.value)}
                className="flex-1"
                style={{ minWidth: '30%' }}
              >
                <View
                  style={{
                    backgroundColor: settings.theme === theme.value ? theme.color : '#f3f4f6',
                    borderWidth: 3,
                    borderColor: settings.theme === theme.value ? theme.color : 'transparent',
                  }}
                  className="p-4 rounded-2xl items-center shadow-sm"
                >
                  <Text className="text-3xl mb-2">{theme.emoji}</Text>
                  <Text
                    className="font-bold text-sm"
                    style={{
                      color: settings.theme === theme.value ? '#fff' : '#374151',
                    }}
                  >
                    {theme.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estilo de Fundo */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🌈 Estilo de Fundo
          </Text>
          <Text className="text-gray-600 text-sm mb-4">
            Escolha o estilo de fundo do app
          </Text>
          <View className="flex-row gap-3">
            {[
              { value: 'gradient', name: 'Gradiente', emoji: '🌈' },
              { value: 'solid', name: 'Sólido', emoji: '⬛' },
              { value: 'pattern', name: 'Padrão', emoji: '🔲' },
            ].map((style) => (
              <TouchableOpacity
                key={style.value}
                onPress={() => updateSetting('backgroundStyle', style.value)}
                className="flex-1"
              >
                <View
                  style={{
                    backgroundColor: settings.backgroundStyle === style.value ? colors.primary : '#f3f4f6',
                    borderWidth: 2,
                    borderColor: settings.backgroundStyle === style.value ? colors.primary : '#e5e7eb',
                  }}
                  className="p-4 rounded-2xl items-center"
                >
                  <Text className="text-2xl mb-1">{style.emoji}</Text>
                  <Text
                    className="font-semibold text-sm text-center"
                    style={{
                      color: settings.backgroundStyle === style.value ? '#fff' : '#374151',
                    }}
                  >
                    {style.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cor de Destaque */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            ✨ Cor de Destaque Secundária
          </Text>
          <Text className="text-gray-600 text-sm mb-4">
            Cor complementar para botões e destaques
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { color: '#38bdf8', name: 'Azul Claro', emoji: '💠' },
              { color: '#f472b6', name: 'Rosa Claro', emoji: '🌸' },
              { color: '#60a5fa', name: 'Azul Médio', emoji: '💎' },
              { color: '#fb923c', name: 'Laranja Claro', emoji: '🔶' },
              { color: '#34d399', name: 'Verde Claro', emoji: '💚' },
              { color: '#a78bfa', name: 'Roxo Claro', emoji: '💜' },
            ].map((accent) => (
              <TouchableOpacity
                key={accent.color}
                onPress={() => updateSetting('accentColor', accent.color)}
                className="flex-1"
                style={{ minWidth: '30%' }}
              >
                <View
                  style={{
                    backgroundColor: settings.accentColor === accent.color ? accent.color : '#f3f4f6',
                    borderWidth: 3,
                    borderColor: settings.accentColor === accent.color ? accent.color : 'transparent',
                  }}
                  className="p-3 rounded-2xl items-center shadow-sm"
                >
                  <Text className="text-2xl mb-1">{accent.emoji}</Text>
                  <Text
                    className="font-bold text-xs text-center"
                    style={{
                      color: settings.accentColor === accent.color ? '#fff' : '#374151',
                    }}
                  >
                    {accent.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notificações e Lembretes */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🔔 Notificações e Lembretes
          </Text>
          
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">Notificações Push</Text>
                <Text className="text-gray-500 text-sm">Receba alertas de novos agendamentos</Text>
              </View>
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => updateSetting('enableNotifications', value)}
                trackColor={{ false: '#d1d5db', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View className="border-t border-gray-100 pt-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">Lembretes Automáticos</Text>
                <Text className="text-gray-500 text-sm">Envie SMS automáticos aos clientes</Text>
              </View>
              <Switch
                value={settings.enableReminders}
                onValueChange={(value) => updateSetting('enableReminders', value)}
                trackColor={{ false: '#d1d5db', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {settings.enableReminders && (
            <View className="bg-gradient-to-r p-4 rounded-xl" style={{ backgroundColor: colors.light }}>
              <Text className="text-gray-700 font-semibold mb-3">Enviar lembrete com antecedência de:</Text>
              <View className="flex-row gap-2">
                {[12, 24, 48].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    onPress={() => updateSetting('reminderHours', hours)}
                    className="flex-1"
                  >
                    <View
                      style={{
                        backgroundColor: settings.reminderHours === hours ? colors.primary : '#fff',
                        borderWidth: 2,
                        borderColor: settings.reminderHours === hours ? colors.primary : '#e5e7eb',
                      }}
                      className="p-3 rounded-xl items-center"
                    >
                      <Text
                        className="font-bold"
                        style={{
                          color: settings.reminderHours === hours ? '#fff' : '#6b7280',
                        }}
                      >
                        {hours}h
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Segurança */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            🔒 Segurança e Privacidade
          </Text>
          <View className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">✅</Text>
              <Text className="font-bold text-green-800 flex-1">Dados Criptografados</Text>
            </View>
            <Text className="text-green-700 text-sm ml-11">
              Todas as informações são criptografadas de ponta a ponta
            </Text>
          </View>
          <View className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">🛡️</Text>
              <Text className="font-bold text-blue-800 flex-1">Conformidade LGPD</Text>
            </View>
            <Text className="text-blue-700 text-sm ml-11">
              100% em conformidade com a Lei Geral de Proteção de Dados
            </Text>
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          onPress={saveSettings}
          disabled={saving}
          style={{ 
            backgroundColor: saving ? '#9ca3af' : colors.primary,
            opacity: saving ? 0.7 : 1 
          }}
          className="rounded-2xl p-5 mb-8 shadow-lg"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-center text-lg font-bold">
              {saving ? '⏳ Salvando Configurações...' : '💾 Salvar Todas as Configurações'}
            </Text>
          </View>
          {!saving && (
            <Text className="text-white/80 text-center text-sm mt-2">
              As alterações serão aplicadas imediatamente
            </Text>
          )}
        </TouchableOpacity>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
