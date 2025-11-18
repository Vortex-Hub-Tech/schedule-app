
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
    case 'green':
      return { 
        primary: '#10b981', 
        light: '#d1fae5',
        gradient: ['#10b981', '#34d399'],
        text: '#065f46'
      };
    case 'purple':
      return { 
        primary: '#8b5cf6', 
        light: '#ede9fe',
        gradient: ['#8b5cf6', '#a78bfa'],
        text: '#6d28d9'
      };
    default: // sky
      return { 
        primary: '#0ea5e9', 
        light: '#e0f2fe',
        gradient: ['#0ea5e9', '#38bdf8'],
        text: '#0369a1'
      };
  }
};
