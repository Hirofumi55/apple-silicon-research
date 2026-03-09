import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // ローカルストレージから設定を読み込む
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    } else if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.remove('light');
    } else {
      // システム設定に従う
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (!prefersDark) {
        document.documentElement.classList.add('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: isDark ? '2px' : '20px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: isDark ? '#a1a1a6' : '#f5c542',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
