// Korasty AI - File Handler

const FileHandler = {
  // Current sources
  sources: [],
  
  /**
   * Initialize file handler
   */
  init() {
    this.sources = Storage.getSources();
    this.setupEventListeners();
    this.renderSourceList();
  },

  /**
   * Setup event listeners for file handling
   */
  setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadSourcesBtn = document.getElementById('uploadSourcesBtn');
    const mainUploadBtn = document.getElementById('mainUploadBtn');
    const addSourceBtn = document.getElementById('addSourceBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // File input change
    fileInput?.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      fileInput.value = '';
    });

    // Upload buttons
    [uploadSourcesBtn, mainUploadBtn, addSourceBtn].forEach(btn => {
      btn?.addEventListener('click', (e) => {
        Utils.createRipple(e, btn);
        fileInput?.click();
      });
    });

    // Search
    searchBtn?.addEventListener('click', () => this.filterSources());
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.filterSources();
    });
    searchInput?.addEventListener('input', Utils.debounce(() => this.filterSources(), 300));

    // Drag and drop
    this.setupDragAndDrop();
  },

  /**
   * Setup drag and drop
   */
  setupDragAndDrop() {
    const centerPanel = document.getElementById('centerPanel');
    const dropzone = document.getElementById('dropzone');

    ['dragenter', 'dragover'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone?.classList.add('active');
      });
    });

    ['dragleave', 'drop'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone?.classList.remove('active');
      });
    });

    document.addEventListener('drop', (e) => {
      if (e.dataTransfer?.files?.length) {
        this.handleFiles(e.dataTransfer.files);
      }
    });
  },

  /**
   * Handle uploaded files
   */
  async handleFiles(fileList) {
    const files = Array.from(fileList);
    
    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (!Utils.isFileSupported(file.name)) {
        errors.push(`${file.name}: صيغة غير مدعومة`);
      } else if (!Utils.validateFileSize(file)) {
        errors.push(`${file.name}: حجم الملف كبير جداً`);
      } else {
        validFiles.push(file);
      }
    });

    // Show errors
    errors.forEach(error => Utils.showToast(error, 'error'));

    if (validFiles.length === 0) return;

    // Process valid files
    Utils.showLoading('جاري رفع الملفات...');

    for (const file of validFiles) {
      try {
        await this.processFile(file);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        Utils.showToast(`خطأ في معالجة ${file.name}`, 'error');
      }
    }

    Utils.hideLoading();
    this.renderSourceList();
    this.updateUI();
    
    Utils.showToast(`تم رفع ${validFiles.length} ملف بنجاح`, 'success');
  },

  /**
   * Process a single file
   */
  async processFile(file) {
    const source = Storage.addSource({
      name: file.name,
      size: file.size,
      sizeText: Utils.formatFileSize(file.size),
      type: file.type || 'file',
      category: Utils.getFileCategory(file.name),
      icon: Utils.getFileIcon(file.name)
    });

    this.sources = Storage.getSources();

    // Read file content
    const category = Utils.getFileCategory(file.name);
    
    try {
      let extractedText = '';
      
      if (category === 'document') {
        if (file.name.endsWith('.pdf')) {
          // For PDF, we'll use Gemini to extract text
          const base64 = await this.readFileAsBase64(file);
          Storage.storeFileContent(source.id, { base64, mimeType: file.type });
          
          if (API.hasApiKey()) {
            Utils.showLoading('جاري استخراج النص من PDF...');
            extractedText = await API.processPDFContent(base64);
          }
        } else {
          // For text files
          extractedText = await Utils.readFileAsText(file);
          Storage.storeFileContent(source.id, { text: extractedText });
        }
      } else if (category === 'image') {
        // Store image and extract text via OCR
        const base64 = await this.readFileAsBase64(file);
        Storage.storeFileContent(source.id, { base64, mimeType: file.type });
        
        if (API.hasApiKey()) {
          Utils.showLoading('جاري استخراج النص من الصورة...');
          extractedText = await API.extractTextFromImage(base64, file.type);
        }
      } else if (category === 'audio') {
        // Store audio and transcribe
        const base64 = await this.readFileAsBase64(file);
        Storage.storeFileContent(source.id, { base64, mimeType: file.type });
        
        if (API.hasApiKey()) {
          Utils.showLoading('جاري نسخ الملف الصوتي...');
          extractedText = await API.transcribeAudio(base64, file.type);
        }
      }

      // Store extracted text
      if (extractedText) {
        Storage.storeExtractedText(source.id, extractedText);
      }

      // Update source status
      Storage.updateSource(source.id, {
        status: extractedText ? 'processed' : 'uploaded',
        hasText: !!extractedText
      });

    } catch (error) {
      console.error('Error extracting content:', error);
      Storage.updateSource(source.id, { status: 'error' });
    }

    this.sources = Storage.getSources();
  },

  /**
   * Read file as Base64
   */
  async readFileAsBase64(file) {
    const buffer = await Utils.readFileAsArrayBuffer(file);
    return Utils.arrayBufferToBase64(buffer);
  },

  /**
   * Render source list
   */
  renderSourceList(filter = '') {
    const sourceList = document.getElementById('sourceList');
    if (!sourceList) return;

    const sources = this.sources.filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (sources.length === 0) {
      sourceList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📚</span>
          <p>${filter ? 'لا توجد نتائج' : 'لا توجد مصادر بعد'}</p>
        </div>
      `;
      return;
    }

    sourceList.innerHTML = sources.map(source => `
      <div class="source-item" data-id="${source.id}">
        <div class="source-info">
          <span class="source-name">
            <span class="source-type">${source.icon}</span>
            ${Utils.escapeHtml(source.name)}
          </span>
          <span class="source-meta">${source.sizeText} • ${Utils.formatRelativeTime(source.createdAt)}</span>
        </div>
        <div class="source-actions">
          <button class="source-action-btn preview" title="معاينة" data-id="${source.id}">👁️</button>
          <button class="source-action-btn delete" title="حذف" data-id="${source.id}">🗑️</button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    sourceList.querySelectorAll('.source-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('source-action-btn')) {
          this.selectSource(item.dataset.id);
        }
      });
    });

    sourceList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSource(btn.dataset.id);
      });
    });

    sourceList.querySelectorAll('.preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previewSource(btn.dataset.id);
      });
    });
  },

  /**
   * Filter sources by search query
   */
  filterSources() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value || '';
    this.renderSourceList(query);
  },

  /**
   * Select a source
   */
  selectSource(id) {
    const source = Storage.getSourceById(id);
    if (!source) return;

    // Remove active class from all
    document.querySelectorAll('.source-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to selected
    document.querySelector(`.source-item[data-id="${id}"]`)?.classList.add('active');

    // Update footer
    document.getElementById('footerInfo').textContent = `${source.name} — ${source.sizeText}`;
    
    Utils.pulseElement(document.getElementById('sourceCount'));
  },

  /**
   * Delete a source
   */
  deleteSource(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المصدر؟')) return;

    Storage.deleteSource(id);
    Storage.clearFileContent(id);
    this.sources = Storage.getSources();
    this.renderSourceList();
    this.updateUI();
    
    Utils.showToast('تم حذف المصدر', 'info');
  },

  /**
   * Preview a source
   */
  async previewSource(id) {
    const source = Storage.getSourceById(id);
    if (!source) return;

    const content = Storage.getFileContent(id);
    const text = Storage.getExtractedText(id);

    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'file-preview';
    modal.innerHTML = `
      <div class="file-preview-content">
        <div class="file-preview-header">
          <h3>${Utils.escapeHtml(source.name)}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="file-preview-body">
          ${this.getPreviewContent(source, content, text)}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Get preview content based on file type
   */
  getPreviewContent(source, content, text) {
    if (source.category === 'image' && content?.base64) {
      return `
        <img src="data:${content.mimeType};base64,${content.base64}" alt="${source.name}" />
        ${text ? `<h4 style="margin-top: 20px;">النص المستخرج:</h4><pre>${Utils.escapeHtml(text)}</pre>` : ''}
      `;
    }

    if (text) {
      return `<pre>${Utils.escapeHtml(text)}</pre>`;
    }

    if (content?.text) {
      return `<pre>${Utils.escapeHtml(content.text)}</pre>`;
    }

    return '<p style="text-align: center; color: var(--text-muted);">لا يمكن عرض محتوى هذا الملف</p>';
  },

  /**
   * Update UI based on sources
   */
  updateUI() {
    const hasSources = this.sources.length > 0;
    const centerCta = document.getElementById('centerCta');
    const chatContainer = document.getElementById('chatContainer');
    const sourceCount = document.getElementById('sourceCount');
    const footerInfo = document.getElementById('footerInfo');
    const studioButtons = document.querySelectorAll('.studio-btn');

    // Toggle CTA vs Chat
    if (centerCta) centerCta.style.display = hasSources ? 'none' : 'flex';
    if (chatContainer) chatContainer.style.display = hasSources ? 'flex' : 'none';

    // Update source count
    if (sourceCount) sourceCount.textContent = `${this.sources.length} مصادر`;

    // Update footer
    if (footerInfo && !hasSources) {
      footerInfo.textContent = 'ارفع مصدراً للبدء';
    }

    // Enable/disable studio buttons
    studioButtons.forEach(btn => {
      btn.disabled = !hasSources || !API.hasApiKey();
    });

    // Initialize chat if needed
    if (hasSources && typeof Chat !== 'undefined') {
      Chat.updateContext();
    }
  },

  /**
   * Get all extracted text for RAG
   */
  getAllText() {
    return Storage.getAllExtractedTexts();
  },

  /**
   * Re-process a source to extract text
   */
  async reprocessSource(id) {
    const source = Storage.getSourceById(id);
    if (!source) return;

    const content = Storage.getFileContent(id);
    if (!content) {
      Utils.showToast('محتوى الملف غير متاح', 'error');
      return;
    }

    Utils.showLoading('جاري معالجة الملف...');

    try {
      let extractedText = '';

      if (source.category === 'document' && content.base64) {
        extractedText = await API.processPDFContent(content.base64);
      } else if (source.category === 'image' && content.base64) {
        extractedText = await API.extractTextFromImage(content.base64, content.mimeType);
      } else if (source.category === 'audio' && content.base64) {
        extractedText = await API.transcribeAudio(content.base64, content.mimeType);
      } else if (content.text) {
        extractedText = content.text;
      }

      if (extractedText) {
        Storage.storeExtractedText(id, extractedText);
        Storage.updateSource(id, { status: 'processed', hasText: true });
        Utils.showToast('تمت معالجة الملف بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error reprocessing source:', error);
      Utils.showToast('خطأ في معالجة الملف', 'error');
    }

    Utils.hideLoading();
    this.sources = Storage.getSources();
    this.renderSourceList();
  }
};

// Make FileHandler globally available
window.FileHandler = FileHandler;
