import React, { useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';

export function FavoriteButton({ isFavorite: initialFavorite, onToggle, size = 24 }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsFavorite(!isFavorite);
    if (onToggle) onToggle(!isFavorite);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.Text
        style={[
          styles.icon,
          {
            fontSize: size,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isFavorite ? '❤️' : '🤍'}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
