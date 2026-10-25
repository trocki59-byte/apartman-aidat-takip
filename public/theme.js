const key = 'apartman-aidat-theme';
export function getTheme() { return document.documentElement.dataset.theme || 'light'; }
function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0d1726' : '#f3f6fa';
  return theme;
}
export function initializeTheme() {
  let stored;
  try { stored = localStorage.getItem(key); } catch {}
  const systemDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return apply(stored === 'light' || stored === 'dark' ? stored : systemDark ? 'dark' : 'light');
}
export function toggleTheme() {
  const theme = apply(getTheme() === 'dark' ? 'light' : 'dark');
  try { localStorage.setItem(key, theme); } catch {}
  return theme;
}
