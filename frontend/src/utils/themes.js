const baseTheme = {
  fonts: {
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
};

// Paletas por categoría con "sentimiento de marca"
export const themes = {
  BARBERSHOP: {
    ...baseTheme,
    colors: {
      // Sobrio / industrial
      primary: '#020617', // slate-950
      secondary: '#111827', // slate-900
      accent: '#f59e0b', // amber-500/600
      background: '#f3f4f6', // gray-100
      text: '#0f172a',
    },
    gradient: {
      hero: 'linear-gradient(to top right, #020617, #111827)',
      button: 'linear-gradient(to right, #020617, #f59e0b)',
    },
    buttonText: {
      primary: '#ffffff',
      secondary: '#020617',
    },
    cardStyle: {
      borderRadius: '0.75rem',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      shadow: '0 10px 25px rgba(15, 23, 42, 0.35)',
    },
    serviceIcons: {
      CUT: '✂️',
      STYLE: '💈',
      COLOR: '🎨',
      TREATMENT: '🧴',
    },
  },
  HAIR_SALON: {
    ...baseTheme,
    colors: {
      // Elegante / profesional
      primary: '#7f1d1d', // rose-900 like
      secondary: '#78350f', // warm brown/gold base
      accent: '#fbbf24', // gold
      background: '#fefce8', // neutral-50 / warm
      text: '#111827',
    },
    gradient: {
      hero: 'linear-gradient(to top right, #7f1d1d, #fbbf24)',
      button: 'linear-gradient(to right, #7f1d1d, #f59e0b)',
    },
    buttonText: {
      primary: '#ffffff',
      secondary: '#111827',
    },
    cardStyle: {
      borderRadius: '1rem',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      shadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
    },
    serviceIcons: {
      CUT: '💇‍♀️',
      STYLE: '🌟',
      COLOR: '🎨',
      TREATMENT: '🧴',
    },
  },
  NAIL_SPA: {
    ...baseTheme,
    colors: {
      // Soft / minimal
      primary: '#ec4899', // pink-500
      secondary: '#db2777', // pink-600
      accent: '#a5b4fc', // pastel-600 (indigo-ish)
      background: '#fdf2f8', // rose/pink-50
      text: '#111827',
    },
    gradient: {
      hero: 'linear-gradient(to top right, #ec4899, #a855f7)',
      button: 'linear-gradient(to right, #ec4899, #a5b4fc)',
    },
    buttonText: {
      primary: '#ffffff',
      secondary: '#111827',
    },
    cardStyle: {
      borderRadius: '1.25rem',
      borderColor: 'rgba(244, 114, 182, 0.25)',
      shadow: '0 14px 40px rgba(236, 72, 153, 0.25)',
    },
    serviceIcons: {
      CUT: '💅',
      STYLE: '✨',
      COLOR: '🎨',
      TREATMENT: '🧴',
    },
  },
};

// Mantiene compatibilidad: quien ya usa colors.primary/accent sigue funcionando
export function getThemeByCategory(category) {
  if (!category) return themes.NAIL_SPA;
  const key = String(category).toUpperCase();
  return themes[key] || themes.NAIL_SPA;
}

export default { themes, getThemeByCategory };
