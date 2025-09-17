'use client';

import { useDarkMode } from '@/hooks/useDarkMode';
import { useEffect } from 'react';

export default function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode } = useDarkMode();

  useEffect(() => {
    // Ensure dark class is applied at the root
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
}