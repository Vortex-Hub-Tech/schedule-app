export const getThemeColors = (theme = 'sky', accentColor = null) => {
  const themes = {
    sky: {
      primary: '#0ea5e9',
      light: '#e0f2fe',
      dark: '#0c4a6e',
      text: '#0ea5e9',
      gradient: ['#0ea5e9', '#38bdf8'],
    },
    pink: {
      primary: '#ec4899',
      light: '#fce7f3',
      dark: '#831843',
      text: '#ec4899',
      gradient: ['#ec4899', '#f472b6'],
    },
    blue: {
      primary: '#3b82f6',
      light: '#dbeafe',
      dark: '#1e3a8a',
      text: '#3b82f6',
      gradient: ['#3b82f6', '#60a5fa'],
    },
    orange: {
      primary: '#f97316',
      light: '#ffedd5',
      dark: '#7c2d12',
      text: '#f97316',
      gradient: ['#f97316', '#fb923c'],
    },
    green: {
      primary: '#10b981',
      light: '#d1fae5',
      dark: '#064e3b',
      text: '#10b981',
      gradient: ['#10b981', '#34d399'],
    },
    purple: {
      primary: '#8b5cf6',
      light: '#ede9fe',
      dark: '#4c1d95',
      text: '#8b5cf6',
      gradient: ['#8b5cf6', '#a78bfa'],
    },
  };

  const baseColors = themes[theme] || themes.sky;

  // Apply custom accent color if provided
  if (accentColor) {
    return {
      ...baseColors,
      accent: accentColor,
    };
  }

  return baseColors;
};