// Korasty AI - Configuration (Frontend for GitHub Pages)

const CONFIG = {
  // API Endpoints - Will be set dynamically from settings
  // Default to empty, user must configure their PythonAnywhere backend URL
  get API_BASE_URL() {
    return Storage.getBackendUrl() || '';
  },
  
  // Google AI (Gemini) direct endpoint for frontend-only operations
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta',
  
  // Supported file types
  SUPPORTED_FORMATS: {
    documents: ['.pdf', '.txt', '.md'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a'],
    images: ['.avif', '.bmp', '.gif', '.ico', '.jp2', '.png', '.webp', '.tif', '.tiff', '.heic', '.heif', '.jpeg', '.jpg', '.jpe']
  },
  
  // Max file sizes (in bytes)
  MAX_FILE_SIZE: {
    document: 50 * 1024 * 1024, // 50MB
    audio: 100 * 1024 * 1024,   // 100MB
    image: 20 * 1024 * 1024     // 20MB
  },
  
  // File type icons
  FILE_ICONS: {
    pdf: '📄',
    txt: '📝',
    md: '📋',
    mp3: '🎵',
    wav: '🎵',
    ogg: '🎵',
    m4a: '🎵',
    default_audio: '🎧',
    default_image: '🖼️',
    default: '📁'
  },
  
  // Studio tool configurations
  STUDIO_TOOLS: {
    audio: {
      name: 'ملخص صوتي',
      nameEn: 'Audio Overview',
      icon: '🎧',
      outputFormat: 'mp3',
      estimatedTime: '2-5 min'
    },
    video: {
      name: 'ملخص فيديو',
      nameEn: 'Video Overview',
      icon: '🎬',
      outputFormat: 'mp4',
      estimatedTime: '5-10 min'
    },
    mindmap: {
      name: 'خريطة ذهنية',
      nameEn: 'Mind Map',
      icon: '🧠',
      outputFormat: 'json',
      estimatedTime: '1-2 min'
    },
    report: {
      name: 'تقرير',
      nameEn: 'Report',
      icon: '📄',
      outputFormat: 'pdf',
      estimatedTime: '2-4 min'
    },
    flashcards: {
      name: 'بطاقات تعليمية',
      nameEn: 'Flashcards',
      icon: '🃏',
      outputFormat: 'json',
      estimatedTime: '1-3 min'
    },
    quiz: {
      name: 'اختبار',
      nameEn: 'Quiz',
      icon: '❓',
      outputFormat: 'json',
      estimatedTime: '1-3 min'
    },
    infographic: {
      name: 'إنفوجرافيك',
      nameEn: 'Infographic',
      icon: '📊',
      outputFormat: 'png',
      estimatedTime: '3-5 min'
    },
    slides: {
      name: 'عرض تقديمي',
      nameEn: 'Slide Deck',
      icon: '📽️',
      outputFormat: 'pptx',
      estimatedTime: '3-6 min'
    }
  },
  
  // Generation options
  GENERATION_OPTIONS: {
    length: {
      short: { name: 'قصير', nameEn: 'Short', multiplier: 0.5 },
      medium: { name: 'متوسط', nameEn: 'Medium', multiplier: 1 },
      long: { name: 'طويل', nameEn: 'Long', multiplier: 1.5 }
    },
    level: {
      beginner: { name: 'مبتدئ', nameEn: 'Beginner' },
      intermediate: { name: 'متوسط', nameEn: 'Intermediate' },
      advanced: { name: 'متقدم', nameEn: 'Advanced' }
    },
    style: {
      formal: { name: 'رسمي', nameEn: 'Formal' },
      conversational: { name: 'محادثة', nameEn: 'Conversational' },
      academic: { name: 'أكاديمي', nameEn: 'Academic' }
    }
  },
  
  // Teacher AI configuration
  TEACHER_AI: {
    name: 'المعلم الذكي',
    avatar: '👨‍🏫',
    defaultGreeting: 'مرحباً! أنا المعلم الذكي. يمكنني مساعدتك في فهم المواد التعليمية التي رفعتها. اسألني أي سؤال!',
    suggestions: [
      'اشرح لي الفكرة الرئيسية',
      'لخص المحتوى',
      'أعطني أمثلة',
      'ما هي النقاط المهمة؟',
      'اختبرني في هذا الموضوع'
    ]
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    API_KEY: 'korasty_api_key',
    BACKEND_URL: 'korasty_backend_url',
    SETTINGS: 'korasty_settings',
    SOURCES: 'korasty_sources',
    CHAT_HISTORY: 'korasty_chat_history',
    OUTPUTS: 'korasty_outputs'
  },
  
  // UI Constants
  UI: {
    TOAST_DURATION: 4000,
    TYPING_SPEED: 30,
    MAX_CHAT_HISTORY: 50
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG.SUPPORTED_FORMATS);
Object.freeze(CONFIG.MAX_FILE_SIZE);
Object.freeze(CONFIG.FILE_ICONS);
Object.freeze(CONFIG.STUDIO_TOOLS);
Object.freeze(CONFIG.GENERATION_OPTIONS);
Object.freeze(CONFIG.TEACHER_AI);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.UI);
