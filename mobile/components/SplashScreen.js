import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen({ onReady }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
      if (onReady) onReady();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0ea5e9', '#0284c7', '#0369a1']}
      className="flex-1 items-center justify-center"
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        <View className="bg-white/10 rounded-3xl px-12 py-8 items-center backdrop-blur-lg border border-white/20">
          <Text className="text-6xl font-bold text-white mb-2">📅</Text>
          <Text className="text-4xl font-bold text-white tracking-wider">
            AgendaFácil
          </Text>
          <Text className="text-sm text-white/80 mt-2 tracking-widest">
            AGENDAMENTO INTELIGENTE
          </Text>
        </View>
        
        <View className="mt-12">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
        
        <Text className="text-white/60 text-xs mt-8">
          Versão 1.0.0
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}
