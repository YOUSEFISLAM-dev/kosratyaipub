// Korasty AI - Utility Functions

const Utils = {
  /**
   * Generate a unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Format file size to human readable string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file extension from filename
   */
  getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
  },

  /**
   * Get file type category
   */
  getFileCategory(filename) {
    const ext = this.getFileExtension(filename);
    if (CONFIG.SUPPORTED_FORMATS.documents.includes(ext)) return 'document';
    if (CONFIG.SUPPORTED_FORMATS.audio.includes(ext)) return 'audio';
    if (CONFIG.SUPPORTED_FORMATS.images.includes(ext)) return 'image';
    return 'unknown';
  },

  /**
   * Get icon for file type
   */
  getFileIcon(filename) {
    const ext = this.getFileExtension(filename).replace('.', '');
    if (CONFIG.FILE_ICONS[ext]) return CONFIG.FILE_ICONS[ext];
    
    const category = this.getFileCategory(filename);
    if (category === 'audio') return CONFIG.FILE_ICONS.default_audio;
    if (category === 'image') return CONFIG.FILE_ICONS.default_image;
    return CONFIG.FILE_ICONS.default;
  },

  /**
   * Check if file type is supported
   */
  isFileSupported(filename) {
    const ext = this.getFileExtension(filename);
    return [
      ...CONFIG.SUPPORTED_FORMATS.documents,
      ...CONFIG.SUPPORTED_FORMATS.audio,
      ...CONFIG.SUPPORTED_FORMATS.images
    ].includes(ext);
  },

  /**
   * Validate file size
   */
  validateFileSize(file) {
    const category = this.getFileCategory(file.name);
    const maxSize = CONFIG.MAX_FILE_SIZE[category] || CONFIG.MAX_FILE_SIZE.document;
    return file.size <= maxSize;
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  },

  /**
   * Format date to Arabic locale
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('ar-EG', { ...defaultOptions, ...options });
  },

  /**
   * Format relative time (e.g., "منذ 5 دقائق")
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return this.formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Deep clone an object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Sleep/delay utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create ripple effect on element
   */
  createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const circle = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.2;
    
    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = (event.clientX - rect.left - size / 2) + 'px';
    circle.style.top = (event.clientY - rect.top - size / 2) + 'px';
    circle.className = 'ripple';
    
    element.appendChild(circle);
    circle.animate(
      [
        { transform: 'scale(0)', opacity: 0.6 },
        { transform: 'scale(1)', opacity: 0 }
      ],
      { duration: 600, easing: 'cubic-bezier(.2,.9,.3,1)' }
    ).onfinish = () => circle.remove();
  },

  /**
   * Pulse animation on element
   */
  pulseElement(element) {
    if (!element) return;
    element.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.06)' },
        { transform: 'scale(1)' }
      ],
      { duration: 420, iterations: 1 }
    );
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show loading overlay
   */
  showLoading(message = 'جاري المعالجة...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    text.textContent = message;
    overlay.style.display = 'flex';
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
  },

  /**
   * Show/hide modal
   */
  showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
  },

  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  },

  /**
   * Update progress bar
   */
  updateProgress(percentage, status = '') {
    const fill = document.getElementById('progressFill');
    const statusEl = document.getElementById('progressStatus');
    if (fill) fill.style.width = `${percentage}%`;
    if (statusEl && status) statusEl.textContent = status;
  },

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Read file as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  /**
   * Read file as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Read file as Data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Download blob as file
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Download text as file
   */
  downloadText(text, filename, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    this.downloadBlob(blob, filename);
  },

  /**
   * Parse markdown to HTML (simple version)
   */
  parseMarkdown(text) {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n/gim, '<br>');
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }
};

// Make Utils globally available
window.Utils = Utils;
