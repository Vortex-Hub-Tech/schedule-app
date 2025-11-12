export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    pink: {
      500: '#ec4899',
      600: '#db2777',
    },
    blue: {
      500: '#3b82f6',
      600: '#2563eb',
    },
    orange: {
      500: '#f97316',
      600: '#ea580c',
    },
  },
  
  getTenantColor(settings) {
    const theme = settings?.theme;
    if (theme === 'pink') return this.colors.pink;
    if (theme === 'blue') return this.colors.blue;
    if (theme === 'orange') return this.colors.orange;
    return this.colors.primary;
  },
};
