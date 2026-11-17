import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const themeKey = 'daily-tracker-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(themeKey) || 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
