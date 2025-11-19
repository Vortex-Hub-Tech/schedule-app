
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { TenantStorage } from '../../../utils/storage';
import { getThemeColors } from '../../../utils/theme';
import { ChatBubble } from '../../../components/ui/ChatBubble';
import { ChatInput } from '../../../components/ui/ChatInput';
import apiClient from '../../../config/api';

export default function PrestadorChat() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef();
  
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const savedTenant = await TenantStorage.getTenant();
      setTenant(savedTenant);
      
      const aptResponse = await apiClient.appointments.getById(id);
      setAppointment(aptResponse.data);
      
      await loadMessages();
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Mock data
      setMessages([
        {
          id: 1,
          message: 'Olá! Vi que você agendou um horário. Tudo certo?',
          is_client: false,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'read'
        },
        {
          id: 2,
          message: 'Oi! Sim, está confirmado para amanhã às 14h?',
          is_client: true,
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          status: 'read'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSend = async (message) => {
    try {
      const newMessage = {
        id: Date.now(),
        message,
        is_client: false,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const colors = getThemeColors(tenant?.settings?.theme || 'sky');

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600">Carregando chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 pb-4 px-6"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <View className="flex-row items-center">
              <Text className="text-white text-xl mr-2">←</Text>
              <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-white text-lg">👤</Text>
              </View>
              <View>
                <Text className="text-white text-lg font-bold">
                  {appointment?.client_name || 'Cliente'}
                </Text>
                <Text className="text-white/80 text-xs">
                  {appointment?.service_name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-gray-100"
        contentContainerStyle={{ paddingVertical: 12 }}
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            isSent={!msg.is_client}
            timestamp={msg.timestamp}
            status={msg.status}
          />
        ))}
      </ScrollView>

      <ChatInput onSend={handleSend} primaryColor={colors.primary} />
    </KeyboardAvoidingView>
  );
}
