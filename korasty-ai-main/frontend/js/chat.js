// Korasty AI - Chat Module (Teacher AI)

const Chat = {
  // Chat history
  history: [],
  // Current context from sources
  context: '',
  // Is typing
  isTyping: false,

  /**
   * Initialize chat
   */
  init() {
    this.history = Storage.getChatHistory();
    this.setupEventListeners();
    this.loadChatHistory();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const exportChatBtn = document.getElementById('exportChatBtn');
    const chatSuggestions = document.getElementById('chatSuggestions');

    // Send message
    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
      Utils.autoResizeTextarea(chatInput);
    });

    // Clear chat
    clearChatBtn?.addEventListener('click', () => this.clearChat());

    // Export chat
    exportChatBtn?.addEventListener('click', () => this.exportChat());

    // Suggestion chips
    chatSuggestions?.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-chip')) {
        const suggestion = e.target.textContent;
        if (chatInput) {
          chatInput.value = suggestion;
          this.sendMessage();
        }
      }
    });
  },

  /**
   * Update context from sources
   */
  updateContext() {
    this.context = FileHandler.getAllText();
  },

  /**
   * Send a message
   */
  async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput?.value?.trim();

    if (!message || this.isTyping) return;

    // Check API key
    if (!API.hasApiKey()) {
      Utils.showToast('يرجى إضافة مفتاح API في الإعدادات', 'warning');
      Utils.showModal('settingsModal');
      return;
    }

    // Clear input
    chatInput.value = '';
    Utils.autoResizeTextarea(chatInput);

    // Add user message
    this.addMessage(message, 'user');

    // Hide suggestions
    document.getElementById('chatSuggestions').style.display = 'none';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get response from API
      const response = await API.chat(message, this.context, this.getHistoryForAPI());
      
      // Remove typing indicator and add response
      this.hideTypingIndicator();
      this.addMessage(response, 'assistant');

    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      this.addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', 'assistant');
      Utils.showToast(error.message || 'خطأ في الاتصال', 'error');
    }
  },

  /**
   * Add a message to the chat
   */
  addMessage(content, role) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Save to history
    const message = Storage.addChatMessage({ content, role });
    this.history.push(message);

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.innerHTML = `
      <div class="message-avatar">${role === 'assistant' ? '👨‍🏫' : '👤'}</div>
      <div class="message-content">
        ${this.formatMessage(content)}
      </div>
    `;

    chatMessages?.appendChild(messageEl);
    
    // Scroll to bottom
    this.scrollToBottom();
  },

  /**
   * Format message content (markdown, etc.)
   */
  formatMessage(content) {
    // Simple markdown parsing
    let html = Utils.escapeHtml(content);
    
    // Convert markdown-like formatting
    html = html
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  },

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.isTyping = true;
    const chatMessages = document.getElementById('chatMessages');
    
    const indicator = document.createElement('div');
    indicator.className = 'message assistant typing';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="message-avatar">👨‍🏫</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    chatMessages?.appendChild(indicator);
    this.scrollToBottom();
  },

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.isTyping = false;
    document.getElementById('typingIndicator')?.remove();
  },

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  /**
   * Load chat history
   */
  loadChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Clear existing messages except welcome
    chatMessages.innerHTML = `
      <div class="message assistant">
        <div class="message-avatar">👨‍🏫</div>
        <div class="message-content">
          <p>${CONFIG.TEACHER_AI.defaultGreeting}</p>
        </div>
      </div>
    `;

    // Add history messages
    this.history.forEach(msg => {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${msg.role}`;
      messageEl.innerHTML = `
        <div class="message-avatar">${msg.role === 'assistant' ? '👨‍🏫' : '👤'}</div>
        <div class="message-content">
          ${this.formatMessage(msg.content)}
        </div>
      `;
      chatMessages.appendChild(messageEl);
    });

    this.scrollToBottom();
  },

  /**
   * Clear chat history
   */
  clearChat() {
    if (!confirm('هل أنت متأكد من مسح المحادثة؟')) return;

    Storage.clearChatHistory();
    this.history = [];
    this.loadChatHistory();
    
    // Show suggestions again
    document.getElementById('chatSuggestions').style.display = 'flex';
    
    Utils.showToast('تم مسح المحادثة', 'info');
  },

  /**
   * Export chat history
   */
  exportChat() {
    if (this.history.length === 0) {
      Utils.showToast('لا توجد محادثة للتصدير', 'info');
      return;
    }

    let text = '# محادثة Korasty AI\n\n';
    text += `التاريخ: ${Utils.formatDate(new Date())}\n\n`;
    text += '---\n\n';

    this.history.forEach(msg => {
      const sender = msg.role === 'user' ? '👤 أنت' : '👨‍🏫 المعلم الذكي';
      text += `**${sender}:**\n${msg.content}\n\n`;
    });

    Utils.downloadText(text, 'korasty-chat.md', 'text/markdown');
    Utils.showToast('تم تصدير المحادثة', 'success');
  },

  /**
   * Get history formatted for API
   */
  getHistoryForAPI() {
    return this.history.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  },

  /**
   * Update suggestions based on context
   */
  updateSuggestions() {
    const suggestions = CONFIG.TEACHER_AI.suggestions;
    const chatSuggestions = document.getElementById('chatSuggestions');
    
    if (!chatSuggestions) return;

    chatSuggestions.innerHTML = suggestions
      .slice(0, 4)
      .map(s => `<button class="suggestion-chip">${s}</button>`)
      .join('');
  }
};

// Make Chat globally available
window.Chat = Chat;
