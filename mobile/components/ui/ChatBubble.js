
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ChatBubble({ message, isSent, timestamp, status }) {
  const formatTime = (time) => {
    try {
      return format(parseISO(time), 'HH:mm', { locale: ptBR });
    } catch {
      return format(new Date(time), 'HH:mm', { locale: ptBR });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '🕐';
    }
  };

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
        <Text style={[styles.text, isSent ? styles.sentText : styles.receivedText]}>
          {message}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.time, isSent ? styles.sentTime : styles.receivedTime]}>
            {formatTime(timestamp)}
          </Text>
          {isSent && (
            <Text style={[styles.status, status === 'read' && styles.statusRead]}>
              {getStatusIcon()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentText: {
    color: '#ffffff',
  },
  receivedText: {
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    marginRight: 4,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTime: {
    color: '#9ca3af',
  },
  status: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusRead: {
    color: '#4ade80',
  },
});
