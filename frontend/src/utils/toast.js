class Toast {
  constructor() {
    this.container = null
    if (typeof document !== 'undefined') {
      this.init()
    }
  }

  init() {
    if (typeof document === 'undefined') return

    this.container = document.createElement('div')
    this.container.id = 'toast-container'
    this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2'
    document.body.appendChild(this.container)
  }

  ensureContainer() {
    if (this.container) {
      return true
    }

    if (typeof document === 'undefined') {
      return false
    }

    this.init()
    return Boolean(this.container)
  }

  show(message, type = 'info', duration = 3000) {
    if (!this.ensureContainer()) {
      return
    }

    const toast = document.createElement('div')
    toast.setAttribute('role', 'status')
    toast.className = 'text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px] animate-slide-in'

    const isDark = document.documentElement.classList.contains('dark')

    const colors = {
      success: isDark ? 'bg-green-600' : 'bg-green-500',
      error: isDark ? 'bg-red-600' : 'bg-red-500',
      info: isDark ? 'bg-blue-600' : 'bg-blue-500',
      warning: isDark ? 'bg-yellow-600' : 'bg-yellow-500',
    }

    toast.classList.add(colors[type] || colors.info)

    const icons = {
      success: '\\u2713',
      error: '\\u2717',
      info: '\\u2139',
      warning: '!',
    }

    const iconSpan = document.createElement('span')
    iconSpan.className = 'text-lg font-bold'
    iconSpan.setAttribute('aria-hidden', 'true')
    iconSpan.textContent = icons[type] || icons.info

    const messageSpan = document.createElement('span')
    messageSpan.className = 'flex-1'
    messageSpan.textContent = message

    toast.append(iconSpan, messageSpan)

    this.container.appendChild(toast)

    setTimeout(() => {
      toast.classList.add('animate-slide-out')
      setTimeout(() => toast.remove(), 300)
    }, duration)
  }

  success(message) {
    this.show(message, 'success')
  }

  error(message) {
    this.show(message, 'error')
  }

  info(message) {
    this.show(message, 'info')
  }

  warning(message) {
    this.show(message, 'warning')
  }
}

export const toast = new Toast()
