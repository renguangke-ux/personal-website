(() => {
  const key = 'renguangke-theme';
  const root = document.documentElement;
  let theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (_) {}
  root.dataset.theme = theme;
  function install() {
    const nav = document.querySelector('body > nav');
    if (!nav) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    function update(value) {
      root.dataset.theme = value;
      const dark = value === 'dark';
      button.textContent = dark ? '☀ 浅色' : '☾ 深色';
      button.setAttribute('aria-label', dark ? '切换为浅色主题' : '切换为深色主题');
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? '切换为浅色主题' : '切换为深色主题';
    }
    update(root.dataset.theme);
    button.addEventListener('click', () => {
      const value = root.dataset.theme === 'dark' ? 'light' : 'dark';
      update(value);
      try { localStorage.setItem(key, value); } catch (_) {}
    });
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === null) update(event.newValue === 'dark' ? 'dark' : 'light');
    });
    nav.append(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
