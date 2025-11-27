// Korasty AI - Main Application (Frontend for GitHub Pages)

const App = {
  /**
   * Initialize the application
   */
  init() {
    console.log('🎓 Korasty AI initializing...');
    
    // Initialize modules
    FileHandler.init();
    Chat.init();
    Studio.init();
    
    // Setup global event listeners
    this.setupEventListeners();
    
    // Load settings
    this.loadSettings();
    
    // Check configuration
    this.checkConfiguration();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    console.log('✅ Korasty AI ready!');
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Settings modal
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');

    settingsBtn?.addEventListener('click', () => {
      Utils.showModal('settingsModal');
    });

    closeSettingsBtn?.addEventListener('click', () => {
      Utils.hideModal('settingsModal');
    });

    settingsModal?.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        Utils.hideModal('settingsModal');
      }
    });

    saveSettingsBtn?.addEventListener('click', () => {
      this.saveSettings();
    });

    // Help button
    document.getElementById('helpBtn')?.addEventListener('click', () => {
      this.showHelp();
    });

    // User avatar
    document.getElementById('userAvatar')?.addEventListener('click', () => {
      Utils.showToast('قريباً: إدارة الحساب', 'info');
    });

    // Window resize
    window.addEventListener('resize', Utils.debounce(() => {
      this.handleResize();
    }, 250));

    // Before unload - warn if unsaved
    window.addEventListener('beforeunload', (e) => {
      const hasUnsavedContent = FileHandler.sources.length > 0;
      if (hasUnsavedContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  },

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + U: Upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.getElementById('fileInput')?.click();
      }

      // / : Focus search
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }

      // Escape: Close modals, clear search
      if (e.key === 'Escape') {
        Utils.hideModal('settingsModal');
        Utils.hideModal('progressModal');
        document.querySelectorAll('.file-preview').forEach(el => el.remove());
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = '';
          FileHandler.filterSources();
        }
      }

      // Ctrl/Cmd + Enter: Send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const chatInput = document.getElementById('chatInput');
        if (document.activeElement === chatInput) {
          Chat.sendMessage();
        }
      }
    });
  },

  /**
   * Check if an input is focused
   */
  isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  },

  /**
   * Load settings from storage
   */
  loadSettings() {
    const settings = Storage.getSettings();
    
    document.getElementById('apiKeyInput').value = settings.apiKey || '';
    document.getElementById('backendUrlInput').value = settings.backendUrl || '';
    document.getElementById('outputLanguage').value = settings.outputLanguage || 'ar';
    document.getElementById('citationsEnabled').checked = settings.citationsEnabled !== false;
  },

  /**
   * Save settings to storage
   */
  saveSettings() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const backendUrl = document.getElementById('backendUrlInput').value.trim().replace(/\/$/, ''); // Remove trailing slash
    const outputLanguage = document.getElementById('outputLanguage').value;
    const citationsEnabled = document.getElementById('citationsEnabled').checked;

    const settings = {
      apiKey,
      backendUrl,
      outputLanguage,
      citationsEnabled
    };

    Storage.saveSettings(settings);
    Utils.hideModal('settingsModal');
    
    // Update UI based on configuration
    this.checkConfiguration();
    FileHandler.updateUI();
    
    Utils.showToast('تم حفظ الإعدادات', 'success');
  },

  /**
   * Check if configuration is complete
   */
  checkConfiguration() {
    const hasKey = API.hasApiKey();
    const hasBackend = API.hasBackendUrl();
    
    if (!hasKey) {
      // Show hint to configure API key
      setTimeout(() => {
        Utils.showToast('يرجى إضافة مفتاح Google AI Studio API في الإعدادات', 'warning', 6000);
      }, 2000);
    }
    
    if (!hasBackend) {
      setTimeout(() => {
        Utils.showToast('يمكنك إضافة رابط الخادم الخلفي لميزات إضافية', 'info', 4000);
      }, 4000);
    }
  },

  /**
   * Handle window resize
   */
  handleResize() {
    // Any resize-specific logic
  },

  /**
   * Show help modal
   */
  showHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal';
    helpModal.id = 'helpModal';
    helpModal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>🎓 مساعدة Korasty AI</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <h3>ما هو Korasty AI؟</h3>
          <p>منصة تعليمية ذكية تحول موادك الدراسية إلى مساعد تعلم تفاعلي وأدوات دراسية جاهزة.</p>
          
          <h3 style="margin-top: 20px;">كيفية الاستخدام</h3>
          <ol style="padding-right: 20px; line-height: 1.8;">
            <li><strong>إضافة مفتاح API:</strong> اذهب للإعدادات وأضف مفتاح Google AI Studio</li>
            <li><strong>إضافة رابط الخادم:</strong> (اختياري) أضف رابط PythonAnywhere للميزات المتقدمة</li>
            <li><strong>رفع المصادر:</strong> ارفع ملفات PDF، نصوص، صور، أو ملفات صوتية</li>
            <li><strong>التحدث مع المعلم:</strong> اسأل أي سؤال حول المحتوى</li>
            <li><strong>استخدام الاستوديو:</strong> أنشئ ملخصات صوتية، بطاقات، اختبارات، وأكثر</li>
          </ol>

          <h3 style="margin-top: 20px;">اختصارات لوحة المفاتيح</h3>
          <ul style="padding-right: 20px; line-height: 1.8;">
            <li><code>Ctrl + U</code> رفع ملف</li>
            <li><code>/</code> البحث في المصادر</li>
            <li><code>Escape</code> إغلاق النوافذ</li>
            <li><code>Ctrl + Enter</code> إرسال الرسالة</li>
          </ul>

          <h3 style="margin-top: 20px;">الصيغ المدعومة</h3>
          <p>PDF, TXT, Markdown, MP3, وجميع صيغ الصور الشائعة</p>

          <div style="margin-top: 24px; padding: 16px; background: rgba(100, 160, 255, 0.1); border-radius: 12px;">
            <strong>💡 نصيحة:</strong> للحصول على أفضل النتائج، ارفع محتوى واضح ومنظم.
          </div>
          
          <div style="margin-top: 16px; padding: 16px; background: rgba(76, 175, 80, 0.1); border-radius: 12px;">
            <strong>🌐 معلومات الاستضافة:</strong><br>
            - الواجهة الأمامية: GitHub Pages<br>
            - الخادم الخلفي (اختياري): PythonAnywhere
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(helpModal);

    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.remove();
    });
  },

  /**
   * Show about info
   */
  showAbout() {
    Utils.showToast('Korasty AI v1.0 - منصة التعلم الذكي', 'info');
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Make App globally available
window.App = App;
