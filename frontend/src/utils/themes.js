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
      primary: '#111827',
      secondary: '#1F2937',
      accent: '#F59E0B',
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
      primary: '#7C3AED',
      secondary: '#4C1D95',
      accent: '#F97316',
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
      primary: '#EC4899',
      secondary: '#BE185D',
      accent: '#FBBF24',
    },
    serviceIcons: {
      CUT: '💅',
      STYLE: '✨',
      COLOR: '🎨',
      TREATMENT: '🧴',
    },
  },
};

export function getThemeByCategory(category) {
  if (!category) return themes.NAIL_SPA;
  const key = String(category).toUpperCase();
  return themes[key] || themes.NAIL_SPA;
}

export default { themes, getThemeByCategory };
