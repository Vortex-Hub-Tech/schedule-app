import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          icon: '⏳',
          text: 'Pendente',
          border: '#fbbf24',
        };
      case 'confirmado':
        return {
          bg: '#dbeafe',
          color: '#1e40af',
          icon: '✓',
          text: 'Confirmado',
          border: '#3b82f6',
        };
      case 'realizado':
        return {
          bg: '#d1fae5',
          color: '#065f46',
          icon: '✅',
          text: 'Realizado',
          border: '#10b981',
        };
      case 'cancelado':
        return {
          bg: '#fee2e2',
          color: '#991b1b',
          icon: '❌',
          text: 'Cancelado',
          border: '#ef4444',
        };
      default:
        return {
          bg: '#f3f4f6',
          color: '#374151',
          icon: '📅',
          text: status || 'Desconhecido',
          border: '#d1d5db',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: config.color }]}>
        {config.icon} {config.text.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
