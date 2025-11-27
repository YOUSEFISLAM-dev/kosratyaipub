// Korasty AI - Local Storage Management (Frontend for GitHub Pages)

const Storage = {
  /**
   * Get item from localStorage with JSON parsing
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  },

  /**
   * Set item in localStorage with JSON stringify
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
      return false;
    }
  },

  /**
   * Clear all Korasty data from localStorage
   */
  clearAll() {
    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
      this.remove(key);
    });
  },

  // ========================================
  // SETTINGS
  // ========================================

  /**
   * Get all settings
   */
  getSettings() {
    return this.get(CONFIG.STORAGE_KEYS.SETTINGS) || {
      apiKey: '',
      backendUrl: '',
      outputLanguage: 'ar',
      citationsEnabled: true,
      theme: 'light'
    };
  },

  /**
   * Save settings
   */
  saveSettings(settings) {
    return this.set(CONFIG.STORAGE_KEYS.SETTINGS, settings);
  },

  /**
   * Get API key
   */
  getApiKey() {
    const settings = this.getSettings();
    return settings.apiKey || '';
  },

  /**
   * Save API key
   */
  saveApiKey(apiKey) {
    const settings = this.getSettings();
    settings.apiKey = apiKey;
    return this.saveSettings(settings);
  },

  /**
   * Get Backend URL
   */
  getBackendUrl() {
    const settings = this.getSettings();
    return settings.backendUrl || '';
  },

  /**
   * Save Backend URL
   */
  saveBackendUrl(url) {
    const settings = this.getSettings();
    settings.backendUrl = url;
    return this.saveSettings(settings);
  },

  // ========================================
  // SOURCES
  // ========================================

  /**
   * Get all sources
   */
  getSources() {
    return this.get(CONFIG.STORAGE_KEYS.SOURCES) || [];
  },

  /**
   * Save sources
   */
  saveSources(sources) {
    return this.set(CONFIG.STORAGE_KEYS.SOURCES, sources);
  },

  /**
   * Add a source
   */
  addSource(source) {
    const sources = this.getSources();
    sources.push({
      id: Utils.generateId(),
      ...source,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    this.saveSources(sources);
    return sources[sources.length - 1];
  },

  /**
   * Update a source
   */
  updateSource(id, updates) {
    const sources = this.getSources();
    const index = sources.findIndex(s => s.id === id);
    if (index !== -1) {
      sources[index] = { ...sources[index], ...updates };
      this.saveSources(sources);
      return sources[index];
    }
    return null;
  },

  /**
   * Delete a source
   */
  deleteSource(id) {
    const sources = this.getSources();
    const filtered = sources.filter(s => s.id !== id);
    this.saveSources(filtered);
    return filtered;
  },

  /**
   * Get source by ID
   */
  getSourceById(id) {
    const sources = this.getSources();
    return sources.find(s => s.id === id);
  },

  // ========================================
  // CHAT HISTORY
  // ========================================

  /**
   * Get chat history
   */
  getChatHistory() {
    return this.get(CONFIG.STORAGE_KEYS.CHAT_HISTORY) || [];
  },

  /**
   * Save chat history
   */
  saveChatHistory(history) {
    // Limit history to max messages
    const trimmed = history.slice(-CONFIG.UI.MAX_CHAT_HISTORY);
    return this.set(CONFIG.STORAGE_KEYS.CHAT_HISTORY, trimmed);
  },

  /**
   * Add message to chat history
   */
  addChatMessage(message) {
    const history = this.getChatHistory();
    history.push({
      id: Utils.generateId(),
      ...message,
      timestamp: new Date().toISOString()
    });
    this.saveChatHistory(history);
    return history[history.length - 1];
  },

  /**
   * Clear chat history
   */
  clearChatHistory() {
    return this.set(CONFIG.STORAGE_KEYS.CHAT_HISTORY, []);
  },

  // ========================================
  // STUDIO OUTPUTS
  // ========================================

  /**
   * Get all outputs
   */
  getOutputs() {
    return this.get(CONFIG.STORAGE_KEYS.OUTPUTS) || [];
  },

  /**
   * Save outputs
   */
  saveOutputs(outputs) {
    return this.set(CONFIG.STORAGE_KEYS.OUTPUTS, outputs);
  },

  /**
   * Add an output
   */
  addOutput(output) {
    const outputs = this.getOutputs();
    outputs.push({
      id: Utils.generateId(),
      ...output,
      createdAt: new Date().toISOString()
    });
    this.saveOutputs(outputs);
    return outputs[outputs.length - 1];
  },

  /**
   * Delete an output
   */
  deleteOutput(id) {
    const outputs = this.getOutputs();
    const filtered = outputs.filter(o => o.id !== id);
    this.saveOutputs(filtered);
    return filtered;
  },

  /**
   * Get output by ID
   */
  getOutputById(id) {
    const outputs = this.getOutputs();
    return outputs.find(o => o.id === id);
  },

  // ========================================
  // SESSION DATA (for current session only)
  // ========================================

  /**
   * Store file content temporarily (using sessionStorage for larger data)
   */
  storeFileContent(sourceId, content) {
    try {
      sessionStorage.setItem(`file_${sourceId}`, JSON.stringify(content));
      return true;
    } catch (error) {
      console.error('Error storing file content:', error);
      return false;
    }
  },

  /**
   * Get file content
   */
  getFileContent(sourceId) {
    try {
      const content = sessionStorage.getItem(`file_${sourceId}`);
      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.error('Error retrieving file content:', error);
      return null;
    }
  },

  /**
   * Clear file content
   */
  clearFileContent(sourceId) {
    sessionStorage.removeItem(`file_${sourceId}`);
  },

  /**
   * Store extracted text (for RAG)
   */
  storeExtractedText(sourceId, text) {
    try {
      sessionStorage.setItem(`text_${sourceId}`, text);
      return true;
    } catch (error) {
      console.error('Error storing extracted text:', error);
      return false;
    }
  },

  /**
   * Get extracted text
   */
  getExtractedText(sourceId) {
    return sessionStorage.getItem(`text_${sourceId}`) || null;
  },

  /**
   * Get all extracted texts combined
   */
  getAllExtractedTexts() {
    const sources = this.getSources();
    let combinedText = '';
    
    sources.forEach(source => {
      const text = this.getExtractedText(source.id);
      if (text) {
        combinedText += `\n\n--- ${source.name} ---\n${text}`;
      }
    });
    
    return combinedText.trim();
  }
};

// Make Storage globally available
window.Storage = Storage;
