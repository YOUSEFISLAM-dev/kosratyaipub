// Korasty AI - Studio Module (Generation Tools)

const Studio = {
  // Selected tool
  selectedTool: null,
  // Generation options
  options: {
    length: 'medium',
    level: 'intermediate',
    style: 'conversational'
  },
  // Generated outputs
  outputs: [],

  /**
   * Initialize studio
   */
  init() {
    this.outputs = Storage.getOutputs();
    this.setupEventListeners();
    this.renderOutputsList();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const studioGrid = document.getElementById('studioGrid');
    const generateBtn = document.getElementById('generateBtn');
    const lengthOption = document.getElementById('lengthOption');
    const levelOption = document.getElementById('levelOption');
    const styleOption = document.getElementById('styleOption');
    const addNoteBtn = document.getElementById('addNoteBtn');

    // Studio tool buttons
    studioGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('.studio-btn');
      if (btn && !btn.disabled) {
        this.selectTool(btn.dataset.tool);
      }
    });

    // Generate button
    generateBtn?.addEventListener('click', () => this.generate());

    // Options
    lengthOption?.addEventListener('change', (e) => {
      this.options.length = e.target.value;
    });
    levelOption?.addEventListener('change', (e) => {
      this.options.level = e.target.value;
    });
    styleOption?.addEventListener('change', (e) => {
      this.options.style = e.target.value;
    });

    // Add note
    addNoteBtn?.addEventListener('click', () => this.addNote());
  },

  /**
   * Select a studio tool
   */
  selectTool(tool) {
    // Check API key
    if (!API.hasApiKey()) {
      Utils.showToast('يرجى إضافة مفتاح API في الإعدادات', 'warning');
      Utils.showModal('settingsModal');
      return;
    }

    // Check if there are sources
    if (FileHandler.sources.length === 0) {
      Utils.showToast('يرجى رفع مصادر أولاً', 'warning');
      return;
    }

    this.selectedTool = tool;
    
    // Update UI
    document.querySelectorAll('.studio-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.studio-btn[data-tool="${tool}"]`)?.classList.add('active');

    // Show options
    document.getElementById('generationOptions').style.display = 'block';
  },

  /**
   * Generate content based on selected tool
   */
  async generate() {
    if (!this.selectedTool) {
      Utils.showToast('يرجى اختيار أداة أولاً', 'warning');
      return;
    }

    const content = FileHandler.getAllText();
    if (!content) {
      Utils.showToast('لا يوجد محتوى للمعالجة', 'warning');
      return;
    }

    const toolConfig = CONFIG.STUDIO_TOOLS[this.selectedTool];
    
    // Show progress modal
    document.getElementById('progressTitle').textContent = `جاري إنشاء ${toolConfig.name}...`;
    Utils.showModal('progressModal');
    Utils.updateProgress(0, 'جاري التحليل...');

    try {
      let result;

      switch (this.selectedTool) {
        case 'audio':
          result = await this.generateAudio(content);
          break;
        case 'video':
          result = await this.generateVideo(content);
          break;
        case 'mindmap':
          result = await this.generateMindMap(content);
          break;
        case 'report':
          result = await this.generateReport(content);
          break;
        case 'flashcards':
          result = await this.generateFlashcards(content);
          break;
        case 'quiz':
          result = await this.generateQuiz(content);
          break;
        case 'infographic':
          result = await this.generateInfographic(content);
          break;
        case 'slides':
          result = await this.generateSlides(content);
          break;
      }

      Utils.hideModal('progressModal');

      if (result) {
        // Save output
        const output = Storage.addOutput({
          type: this.selectedTool,
          name: toolConfig.name,
          icon: toolConfig.icon,
          format: toolConfig.outputFormat,
          data: result,
          options: { ...this.options }
        });

        this.outputs = Storage.getOutputs();
        this.renderOutputsList();
        
        Utils.showToast(`تم إنشاء ${toolConfig.name} بنجاح`, 'success');
        
        // Show preview
        this.previewOutput(output.id);
      }

    } catch (error) {
      console.error('Generation error:', error);
      Utils.hideModal('progressModal');
      Utils.showToast(error.message || 'خطأ في الإنشاء', 'error');
    }
  },

  /**
   * Generate audio overview
   */
  async generateAudio(content) {
    Utils.updateProgress(20, 'جاري إنشاء النص الصوتي...');
    const script = await API.generateAudioScript(content, this.options);
    
    Utils.updateProgress(80, 'جاري تجهيز الملخص...');
    
    // Note: Actual TTS would require additional API integration
    // For now, we return the script text
    return {
      script,
      duration: this.estimateDuration(script),
      note: 'النص جاهز للتحويل إلى صوت باستخدام خدمة TTS'
    };
  },

  /**
   * Generate video overview
   */
  async generateVideo(content) {
    Utils.updateProgress(20, 'جاري إنشاء محتوى الفيديو...');
    
    // Generate script and slides together
    const [scriptResult, slidesResult] = await Promise.all([
      API.generateAudioScript(content, this.options),
      API.generateSlides(content, this.options)
    ]);

    Utils.updateProgress(80, 'جاري تجهيز المحتوى...');

    return {
      script: scriptResult,
      slides: slidesResult.presentation,
      note: 'المحتوى جاهز للتحويل إلى فيديو'
    };
  },

  /**
   * Generate mind map
   */
  async generateMindMap(content) {
    Utils.updateProgress(30, 'جاري تحليل المحتوى...');
    const result = await API.generateMindMap(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return result.mindmap;
  },

  /**
   * Generate report
   */
  async generateReport(content) {
    Utils.updateProgress(20, 'جاري إنشاء التقرير...');
    const report = await API.generateReport(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return { markdown: report };
  },

  /**
   * Generate flashcards
   */
  async generateFlashcards(content) {
    Utils.updateProgress(30, 'جاري إنشاء البطاقات...');
    const result = await API.generateFlashcards(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return result.flashcards;
  },

  /**
   * Generate quiz
   */
  async generateQuiz(content) {
    Utils.updateProgress(30, 'جاري إنشاء الاختبار...');
    const result = await API.generateQuiz(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return result.quiz;
  },

  /**
   * Generate infographic content
   */
  async generateInfographic(content) {
    Utils.updateProgress(30, 'جاري إنشاء الإنفوجرافيك...');
    const result = await API.generateInfographic(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return result.infographic;
  },

  /**
   * Generate slides
   */
  async generateSlides(content) {
    Utils.updateProgress(30, 'جاري إنشاء العرض...');
    const result = await API.generateSlides(content, this.options);
    Utils.updateProgress(100, 'تم!');
    return result.presentation;
  },

  /**
   * Estimate audio duration from text
   */
  estimateDuration(text) {
    // Average Arabic reading speed: ~150 words per minute
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 150);
    return `~${minutes} دقيقة`;
  },

  /**
   * Render outputs list
   */
  renderOutputsList() {
    const outputsList = document.getElementById('outputsList');
    if (!outputsList) return;

    if (this.outputs.length === 0) {
      outputsList.innerHTML = `
        <div class="empty-state small">
          <span class="empty-icon">📦</span>
          <p>لا توجد مخرجات بعد</p>
        </div>
      `;
      return;
    }

    outputsList.innerHTML = this.outputs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(output => `
        <div class="output-item" data-id="${output.id}">
          <span class="output-icon">${output.icon}</span>
          <div class="output-info">
            <span class="output-name">${Utils.escapeHtml(output.name)}</span>
            <span class="output-meta">${Utils.formatRelativeTime(output.createdAt)}</span>
          </div>
          <div class="output-actions">
            <button class="output-action-btn preview" title="معاينة" data-id="${output.id}">👁️</button>
            <button class="output-action-btn download" title="تحميل" data-id="${output.id}">⬇️</button>
            <button class="output-action-btn delete" title="حذف" data-id="${output.id}">🗑️</button>
          </div>
        </div>
      `).join('');

    // Add event listeners
    outputsList.querySelectorAll('.output-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('output-action-btn')) {
          this.previewOutput(item.dataset.id);
        }
      });
    });

    outputsList.querySelectorAll('.preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previewOutput(btn.dataset.id);
      });
    });

    outputsList.querySelectorAll('.download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadOutput(btn.dataset.id);
      });
    });

    outputsList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteOutput(btn.dataset.id);
      });
    });
  },

  /**
   * Preview an output
   */
  previewOutput(id) {
    const output = Storage.getOutputById(id);
    if (!output) return;

    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'file-preview';
    modal.innerHTML = `
      <div class="file-preview-content" style="max-width: 800px; max-height: 80vh;">
        <div class="file-preview-header">
          <h3>${output.icon} ${Utils.escapeHtml(output.name)}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="file-preview-body" style="overflow: auto;">
          ${this.getOutputPreview(output)}
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

    // Initialize interactive elements
    this.initializePreviewInteractions(modal, output);
  },

  /**
   * Get preview content for output
   */
  getOutputPreview(output) {
    switch (output.type) {
      case 'flashcards':
        return this.getFlashcardsPreview(output.data);
      case 'quiz':
        return this.getQuizPreview(output.data);
      case 'mindmap':
        return this.getMindMapPreview(output.data);
      case 'report':
        return this.getReportPreview(output.data);
      case 'slides':
        return this.getSlidesPreview(output.data);
      case 'infographic':
        return this.getInfographicPreview(output.data);
      case 'audio':
      case 'video':
        return this.getMediaPreview(output.data);
      default:
        return `<pre>${JSON.stringify(output.data, null, 2)}</pre>`;
    }
  },

  /**
   * Get flashcards preview
   */
  getFlashcardsPreview(flashcards) {
    if (!flashcards || flashcards.length === 0) {
      return '<p>لا توجد بطاقات</p>';
    }

    return `
      <div class="flashcard-preview">
        <div class="flashcard" id="flashcardContainer">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <p id="flashcardQuestion">${Utils.escapeHtml(flashcards[0].question)}</p>
            </div>
            <div class="flashcard-back">
              <p id="flashcardAnswer">${Utils.escapeHtml(flashcards[0].answer)}</p>
            </div>
          </div>
        </div>
        <p class="flashcard-counter" id="flashcardCounter">1 / ${flashcards.length}</p>
        <div class="flashcard-nav">
          <button id="prevCard" disabled>السابق</button>
          <button id="flipCard">اقلب البطاقة</button>
          <button id="nextCard" ${flashcards.length <= 1 ? 'disabled' : ''}>التالي</button>
        </div>
      </div>
    `;
  },

  /**
   * Get quiz preview
   */
  getQuizPreview(quiz) {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return '<p>لا توجد أسئلة</p>';
    }

    return `
      <div class="quiz-preview" id="quizContainer">
        <h3 style="margin-bottom: 20px;">${Utils.escapeHtml(quiz.title || 'اختبار')}</h3>
        ${quiz.questions.map((q, i) => `
          <div class="quiz-question" data-index="${i}">
            <p class="quiz-question-text">${i + 1}. ${Utils.escapeHtml(q.question)}</p>
            <div class="quiz-options">
              ${q.options.map((opt, j) => `
                <div class="quiz-option" data-question="${i}" data-option="${j}">
                  <span class="quiz-option-marker">${['أ', 'ب', 'ج', 'د'][j]}</span>
                  <span>${Utils.escapeHtml(opt)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <button class="generate-btn quiz-submit" id="submitQuiz" style="margin-top: 20px;">تحقق من الإجابات</button>
        <div class="quiz-result" id="quizResult" style="display: none;"></div>
      </div>
    `;
  },

  /**
   * Get mind map preview
   */
  getMindMapPreview(mindmap) {
    if (!mindmap || !mindmap.title) {
      return '<p>لا توجد خريطة ذهنية</p>';
    }

    // Create container for jsMind
    const containerId = `mindmap_${Date.now()}`;
    
    // Return HTML with container
    setTimeout(() => {
      this.renderJsMind(containerId, mindmap);
    }, 100);

    return `
      <div class="mindmap-container">
        <div id="${containerId}" style="width: 100%; height: 100%;"></div>
        <div class="mindmap-controls">
          <button class="mindmap-control-btn" onclick="Studio.zoomIn('${containerId}')" title="تكبير">+</button>
          <button class="mindmap-control-btn" onclick="Studio.zoomOut('${containerId}')" title="تصغير">−</button>
          <button class="mindmap-control-btn" onclick="Studio.resetZoom('${containerId}')" title="إعادة ضبط">⟲</button>
        </div>
      </div>
    `;
  },

  /**
   * Render mind map using jsMind
   */
  renderJsMind(containerId, mindmap) {
    if (typeof jsMind === 'undefined') {
      console.error('jsMind library not loaded');
      return;
    }

    // Convert our mindmap format to jsMind format
    const jsMindData = {
      meta: {
        name: mindmap.title,
        version: '1.0'
      },
      format: 'node_tree',
      data: {
        id: 'root',
        topic: mindmap.title,
        direction: 'right',
        children: mindmap.branches.map((branch, idx) => ({
          id: `branch_${idx}`,
          topic: branch.name,
          direction: idx % 2 === 0 ? 'right' : 'left',
          children: branch.children.map((child, childIdx) => ({
            id: `child_${idx}_${childIdx}`,
            topic: child.name
          }))
        }))
      }
    };

    // jsMind options
    const options = {
      container: containerId,
      theme: 'primary',
      editable: false,
      view: {
        engine: 'canvas',
        hmargin: 120,
        vmargin: 80,
        line_width: 2,
        line_color: 'rgba(100, 160, 255, 0.4)'
      },
      layout: {
        hspace: 80,
        vspace: 40,
        pspace: 15
      },
      shortcut: {
        enable: false
      }
    };

    // Create jsMind instance
    const jm = new jsMind(options);
    jm.show(jsMindData);
    
    // Store instance for zoom controls
    if (!window.jsMindInstances) {
      window.jsMindInstances = {};
    }
    window.jsMindInstances[containerId] = jm;
  },

  /**
   * Zoom in mind map
   */
  zoomIn(containerId) {
    const jm = window.jsMindInstances?.[containerId];
    if (jm) {
      jm.view.zoom_in();
    }
  },

  /**
   * Zoom out mind map
   */
  zoomOut(containerId) {
    const jm = window.jsMindInstances?.[containerId];
    if (jm) {
      jm.view.zoom_out();
    }
  },

  /**
   * Reset zoom
   */
  resetZoom(containerId) {
    const jm = window.jsMindInstances?.[containerId];
    if (jm) {
      jm.view.set_zoom(1);
    }
  },

  /**
   * Get report preview
   */
  getReportPreview(report) {
    if (!report || !report.markdown) {
      return '<p>لا يوجد تقرير</p>';
    }

    return `
      <div class="report-preview" style="padding: 20px; line-height: 1.8;">
        ${Utils.parseMarkdown(report.markdown)}
      </div>
    `;
  },

  /**
   * Get slides preview
   */
  getSlidesPreview(presentation) {
    if (!presentation || !presentation.slides || presentation.slides.length === 0) {
      return '<p>لا توجد شرائح</p>';
    }

    return `
      <div class="slides-preview">
        <h3 style="text-align: center; margin-bottom: 20px;">${Utils.escapeHtml(presentation.title)}</h3>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${presentation.slides.map((slide, i) => `
            <div style="background: linear-gradient(135deg, rgba(100, 160, 255, 0.1), rgba(100, 160, 255, 0.05)); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <h4>${Utils.escapeHtml(slide.title)}</h4>
                <span style="color: var(--text-muted); font-size: 12px;">شريحة ${i + 1}</span>
              </div>
              <ul style="margin: 0 0 12px; padding-right: 20px;">
                ${slide.points.map(point => `<li>${Utils.escapeHtml(point)}</li>`).join('')}
              </ul>
              ${slide.speakerNotes ? `
                <details style="font-size: 13px; color: var(--text-muted);">
                  <summary>ملاحظات المتحدث</summary>
                  <p style="margin-top: 8px;">${Utils.escapeHtml(slide.speakerNotes)}</p>
                </details>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Get infographic preview
   */
  getInfographicPreview(infographic) {
    if (!infographic || !infographic.title) {
      return '<p>لا يوجد إنفوجرافيك</p>';
    }

    return `
      <div class="infographic-preview" style="padding: 20px; text-align: center;">
        <h2 style="font-size: 24px; margin-bottom: 8px;">${Utils.escapeHtml(infographic.title)}</h2>
        ${infographic.subtitle ? `<p style="color: var(--text-muted); margin-bottom: 24px;">${Utils.escapeHtml(infographic.subtitle)}</p>` : ''}
        
        <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin-bottom: 24px;">
          ${infographic.points.map(point => `
            <div style="background: rgba(255, 255, 255, 0.5); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px; width: 200px; text-align: center;">
              <span style="font-size: 32px; display: block; margin-bottom: 8px;">${point.icon}</span>
              <strong style="display: block; margin-bottom: 4px;">${Utils.escapeHtml(point.title)}</strong>
              <span style="font-size: 13px; color: var(--text-muted);">${Utils.escapeHtml(point.description)}</span>
            </div>
          `).join('')}
        </div>

        ${infographic.stats && infographic.stats.length > 0 ? `
          <div style="display: flex; gap: 24px; justify-content: center; margin-bottom: 24px;">
            ${infographic.stats.map(stat => `
              <div>
                <span style="font-size: 36px; font-weight: 700; color: var(--accent-primary);">${stat.value}</span>
                <span style="display: block; font-size: 13px; color: var(--text-muted);">${Utils.escapeHtml(stat.label)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${infographic.conclusion ? `
          <p style="font-style: italic; color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
            ${Utils.escapeHtml(infographic.conclusion)}
          </p>
        ` : ''}
      </div>
    `;
  },

  /**
   * Get media preview (audio/video)
   */
  getMediaPreview(data) {
    return `
      <div style="padding: 20px;">
        <h4>النص الصوتي</h4>
        <pre style="white-space: pre-wrap; background: rgba(0,0,0,0.05); padding: 16px; border-radius: 8px; max-height: 400px; overflow: auto;">${Utils.escapeHtml(data.script)}</pre>
        <p style="margin-top: 12px; color: var(--text-muted);">المدة المقدرة: ${data.duration}</p>
        ${data.note ? `<p style="color: var(--text-muted); font-size: 13px;">${data.note}</p>` : ''}
      </div>
    `;
  },

  /**
   * Initialize preview interactions
   */
  initializePreviewInteractions(modal, output) {
    if (output.type === 'flashcards') {
      this.initFlashcardInteraction(modal, output.data);
    } else if (output.type === 'quiz') {
      this.initQuizInteraction(modal, output.data);
    }
  },

  /**
   * Initialize flashcard interaction
   */
  initFlashcardInteraction(modal, flashcards) {
    let currentIndex = 0;
    let isFlipped = false;

    const container = modal.querySelector('#flashcardContainer');
    const question = modal.querySelector('#flashcardQuestion');
    const answer = modal.querySelector('#flashcardAnswer');
    const counter = modal.querySelector('#flashcardCounter');
    const prevBtn = modal.querySelector('#prevCard');
    const nextBtn = modal.querySelector('#nextCard');
    const flipBtn = modal.querySelector('#flipCard');

    const updateCard = () => {
      question.textContent = flashcards[currentIndex].question;
      answer.textContent = flashcards[currentIndex].answer;
      counter.textContent = `${currentIndex + 1} / ${flashcards.length}`;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === flashcards.length - 1;
      container.classList.remove('flipped');
      isFlipped = false;
    };

    flipBtn?.addEventListener('click', () => {
      container.classList.toggle('flipped');
      isFlipped = !isFlipped;
    });

    prevBtn?.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCard();
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        updateCard();
      }
    });

    container?.addEventListener('click', () => {
      container.classList.toggle('flipped');
      isFlipped = !isFlipped;
    });
  },

  /**
   * Initialize quiz interaction
   */
  initQuizInteraction(modal, quiz) {
    const options = modal.querySelectorAll('.quiz-option');
    const submitBtn = modal.querySelector('#submitQuiz');
    const resultDiv = modal.querySelector('#quizResult');
    const answers = {};

    options.forEach(option => {
      option.addEventListener('click', () => {
        const questionIdx = option.dataset.question;
        
        // Remove selection from other options in same question
        modal.querySelectorAll(`.quiz-option[data-question="${questionIdx}"]`).forEach(opt => {
          opt.classList.remove('selected');
        });
        
        option.classList.add('selected');
        answers[questionIdx] = parseInt(option.dataset.option);
      });
    });

    submitBtn?.addEventListener('click', () => {
      let correct = 0;
      
      quiz.questions.forEach((q, i) => {
        const selectedOption = answers[i];
        const questionOptions = modal.querySelectorAll(`.quiz-option[data-question="${i}"]`);
        
        questionOptions.forEach((opt, j) => {
          opt.classList.remove('selected');
          if (j === q.correctIndex) {
            opt.classList.add('correct');
          } else if (j === selectedOption && selectedOption !== q.correctIndex) {
            opt.classList.add('incorrect');
          }
        });

        if (selectedOption === q.correctIndex) {
          correct++;
        }
      });

      const percentage = Math.round((correct / quiz.questions.length) * 100);
      const passed = percentage >= 60;

      resultDiv.style.display = 'block';
      resultDiv.className = `quiz-result ${passed ? 'passed' : 'failed'}`;
      resultDiv.innerHTML = `
        <h4>${passed ? '🎉 أحسنت!' : '😔 حاول مرة أخرى'}</h4>
        <p>النتيجة: ${correct} من ${quiz.questions.length} (${percentage}%)</p>
      `;

      submitBtn.disabled = true;
    });
  },

  /**
   * Download an output
   */
  downloadOutput(id) {
    const output = Storage.getOutputById(id);
    if (!output) return;

    const filename = `korasty-${output.type}-${Date.now()}`;

    switch (output.type) {
      case 'report':
        Utils.downloadText(output.data.markdown, `${filename}.md`, 'text/markdown');
        break;
      case 'flashcards':
        // Export as CSV for Anki
        const csv = output.data.map(f => `"${f.question}","${f.answer}"`).join('\n');
        Utils.downloadText(csv, `${filename}.csv`, 'text/csv');
        break;
      case 'quiz':
      case 'mindmap':
      case 'slides':
      case 'infographic':
        Utils.downloadText(JSON.stringify(output.data, null, 2), `${filename}.json`, 'application/json');
        break;
      case 'audio':
      case 'video':
        Utils.downloadText(output.data.script, `${filename}-script.txt`, 'text/plain');
        break;
      default:
        Utils.downloadText(JSON.stringify(output.data, null, 2), `${filename}.json`, 'application/json');
    }

    Utils.showToast('تم تحميل الملف', 'success');
  },

  /**
   * Delete an output
   */
  deleteOutput(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المخرج؟')) return;

    Storage.deleteOutput(id);
    this.outputs = Storage.getOutputs();
    this.renderOutputsList();
    
    Utils.showToast('تم الحذف', 'info');
  },

  /**
   * Add a note
   */
  addNote() {
    const note = prompt('أدخل ملاحظتك:');
    if (!note) return;

    const output = Storage.addOutput({
      type: 'note',
      name: 'ملاحظة',
      icon: '📝',
      format: 'txt',
      data: { text: note }
    });

    this.outputs = Storage.getOutputs();
    this.renderOutputsList();
    
    Utils.showToast('تمت إضافة الملاحظة', 'success');
  }
};

// Make Studio globally available
window.Studio = Studio;
