(function () {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function getCurrentTheme() {
    const explicitTheme = document.documentElement.getAttribute('data-theme');
    if (explicitTheme) return explicitTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function updateToggleLabel(button) {
    const theme = getCurrentTheme();

    button.textContent = theme === 'dark' ? '☀️' : '🌙';
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
    button.setAttribute(
      'title',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    updateToggleLabel(toggle);

    toggle.addEventListener('click', function () {
      const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
      updateToggleLabel(toggle);
    });
  });
})();
