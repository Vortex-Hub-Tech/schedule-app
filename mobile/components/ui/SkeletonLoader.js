import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function SkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.iconSkeleton, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.descriptionSkeleton, { opacity }]} />
      <View style={styles.footer}>
        <Animated.View style={[styles.tagSkeleton, { opacity }]} />
        <Animated.View style={[styles.priceSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleSkeleton: {
    width: '70%',
    height: 24,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: '40%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  descriptionSkeleton: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagSkeleton: {
    width: 100,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  priceSkeleton: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
});
