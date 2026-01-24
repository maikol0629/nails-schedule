const baseTheme = {
  fonts: {
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
};

export const themes = {
  BARBERSHOP: {
    ...baseTheme,
    colors: {
      primary: '#020617',
      secondary: '#111827',
      accent: '#f59e0b',
      background: '#f3f4f6',
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
  },
  HAIR_SALON: {
    ...baseTheme,
    colors: {
      primary: '#7f1d1d',
      secondary: '#78350f',
      accent: '#fbbf24',
      background: '#fefce8',
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
  },
  NAIL_SPA: {
    ...baseTheme,
    colors: {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#a5b4fc',
      background: '#fdf2f8',
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
  },
};

export function getThemeByCategory(category) {
  if (!category) return themes.NAIL_SPA;
  const key = String(category).toUpperCase();
  return themes[key] || themes.NAIL_SPA;
}

export default { themes, getThemeByCategory };
