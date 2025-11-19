import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export function StarRating({ rating = 0, onRatingChange, editable = false, size = 24 }) {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (value) => {
    if (editable && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          disabled={!editable}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: size }}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function StarRatingDisplay({ rating = 0, count = 0, size = 16 }) {
  return (
    <View style={styles.displayContainer}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={{ fontSize: size }}>
            {star <= Math.round(rating) ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating.toFixed(1)} {count > 0 && `(${count})`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});
