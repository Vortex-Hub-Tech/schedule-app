import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen({ onReady }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
    }, 5000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onReady]);

  return (
    <LinearGradient
      colors={["#0ea5e9", "#0284c7", "#0369a1"]}
      style={styles.container}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        <View style={styles.card}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.title}>AgendaFácil</Text>
          <Text style={styles.subtitle}>AGENDAMENTO INTELIGENTE</Text>
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>

        <Text style={styles.version}>Versão 1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    paddingHorizontal: 48,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  icon: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    letterSpacing: 4,
  },
  loaderContainer: {
    marginTop: 48,
  },
  version: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    marginTop: 32,
  },
});
