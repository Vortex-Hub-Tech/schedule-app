export const getThemeColors = (theme) => {
  switch (theme) {
    case 'pink':
      return { 
        primary: '#ec4899', 
        light: '#fce7f3',
        gradient: ['#ec4899', '#f472b6'],
        text: '#be185d'
      };
    case 'blue':
      return { 
        primary: '#3b82f6', 
        light: '#dbeafe',
        gradient: ['#3b82f6', '#60a5fa'],
        text: '#1e40af'
      };
    case 'orange':
      return { 
        primary: '#f97316', 
        light: '#ffedd5',
        gradient: ['#f97316', '#fb923c'],
        text: '#c2410c'
      };
    default:
      return { 
        primary: '#0ea5e9', 
        light: '#e0f2fe',
        gradient: ['#0ea5e9', '#38bdf8'],
        text: '#0369a1'
      };
  }
};
