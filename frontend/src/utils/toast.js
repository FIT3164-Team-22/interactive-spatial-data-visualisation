class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const isDark = document.documentElement.classList.contains('dark');

    const colors = {
      success: isDark ? 'bg-green-600' : 'bg-green-500',
      error: isDark ? 'bg-red-600' : 'bg-red-500',
      info: isDark ? 'bg-blue-600' : 'bg-blue-500',
      warning: isDark ? 'bg-yellow-600' : 'bg-yellow-500',
    };

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };

    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px] animate-slide-in`;
    toast.innerHTML = `
      <span class="text-lg font-bold">${icons[type]}</span>
      <span class="flex-1">${message}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message) {
    this.show(message, 'success');
  }

  error(message) {
    this.show(message, 'error');
  }

  info(message) {
    this.show(message, 'info');
  }

  warning(message) {
    this.show(message, 'warning');
  }
}

export const toast = new Toast();
