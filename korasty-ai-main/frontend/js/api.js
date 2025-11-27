// Korasty AI - API Client (Frontend for GitHub Pages)
// Supports both direct Gemini API calls and PythonAnywhere backend

const API = {
  // Gemini direct endpoint
  geminiEndpoint: CONFIG.GEMINI_ENDPOINT,
  
  /**
   * Get API key from storage
   */
  getApiKey() {
    return Storage.getApiKey();
  },

  /**
   * Get backend URL from storage
   */
  getBackendUrl() {
    return Storage.getBackendUrl();
  },

  /**
   * Check if API key is configured
   */
  hasApiKey() {
    return !!this.getApiKey();
  },

  /**
   * Check if backend URL is configured
   */
  hasBackendUrl() {
    return !!this.getBackendUrl();
  },

  /**
   * Make a request to the PythonAnywhere backend
   */
  async callBackend(endpoint, body = {}, method = 'POST') {
    const backendUrl = this.getBackendUrl();
    if (!backendUrl) {
      throw new Error('رابط الخادم الخلفي غير مُعَد. يرجى إضافته في الإعدادات.');
    }

    const apiKey = this.getApiKey();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || ''
      }
    };

    if (method !== 'GET' && Object.keys(body).length > 0) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${backendUrl}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'خطأ في الاتصال بالخادم' }));
      throw new Error(error.error || 'خطأ في API');
    }

    return response.json();
  },

  /**
   * Make a request to Google AI Studio (Gemini) directly
   */
  async callGemini(endpoint, body) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('مفتاح API غير مُعَد. يرجى إضافة مفتاح API في الإعدادات.');
    }

    const response = await fetch(`${this.geminiEndpoint}${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'خطأ في API');
    }

    return response.json();
  },

  /**
   * Generate content using Gemini
   */
  async generateContent(prompt, options = {}) {
    const model = options.model || 'gemini-2.5-flash';
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4096,
        topP: options.topP || 0.9
      }
    };

    // Add system instruction if provided
    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    const result = await this.callGemini(`/models/${model}:generateContent`, body);
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  /**
   * Chat with context (for Teacher AI)
   */
  async chat(message, context = '', history = []) {
    // Try backend first if configured, otherwise use direct Gemini API
    if (this.hasBackendUrl()) {
      try {
        const result = await this.callBackend('/api/chat', {
          message,
          context,
          history
        });
        return result.response;
      } catch (error) {
        console.warn('Backend call failed, falling back to direct Gemini API:', error);
      }
    }

    // Direct Gemini API call
    const systemInstruction = `أنت "المعلم الذكي" - مساعد تعليمي ذكي يتحدث العربية بطلاقة.
    
مهمتك:
- شرح المفاهيم بوضوح وبساطة
- الإجابة على الأسئلة المتعلقة بالمحتوى التعليمي
- تقديم أمثلة توضيحية
- مساعدة الطلاب في الفهم العميق

قواعد مهمة:
- استخدم اللغة العربية الفصحى السهلة
- أجب بناءً على المحتوى المتاح عندما يكون ذا صلة
- إذا لم يكن لديك معلومات كافية، اطلب توضيحاً
- كن ودوداً ومشجعاً
- قدم الاستشهادات عند الحاجة

${context ? `المحتوى المتاح للرجوع إليه:\n${context}` : 'لا يوجد محتوى متاح حالياً.'}`;

    const contents = [];
    
    // Add chat history
    history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const result = await this.callGemini('/models/gemini-2.5-flash:generateContent', body);
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  /**
   * Generate Arabic audio overview script
   */
  async generateAudioScript(content, options = {}) {
    const prompt = `اكتب نصاً للقراءة الصوتية (Audio Overview) باللغة العربية يلخص المحتوى التالي.

المتطلبات:
- اكتب بأسلوب ${options.style === 'formal' ? 'رسمي' : options.style === 'academic' ? 'أكاديمي' : 'محادثة طبيعية'}
- المستوى المستهدف: ${options.level === 'beginner' ? 'مبتدئ' : options.level === 'advanced' ? 'متقدم' : 'متوسط'}
- الطول: ${options.length === 'short' ? 'قصير (2-3 دقائق)' : options.length === 'long' ? 'طويل (8-10 دقائق)' : 'متوسط (5-6 دقائق)'}
- ابدأ بمقدمة جذابة
- قسّم المحتوى إلى أقسام واضحة
- اختم بخلاصة وأفكار رئيسية

المحتوى:
${content}

اكتب النص المناسب للقراءة الصوتية:`;

    return this.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 4096
    });
  },

  /**
   * Generate flashcards in Arabic
   */
  async generateFlashcards(content, options = {}) {
    const count = options.length === 'short' ? 10 : options.length === 'long' ? 30 : 20;
    
    const prompt = `أنشئ ${count} بطاقة تعليمية (Flashcards) باللغة العربية من المحتوى التالي.

المتطلبات:
- المستوى: ${options.level === 'beginner' ? 'مبتدئ' : options.level === 'advanced' ? 'متقدم' : 'متوسط'}
- كل بطاقة تحتوي على سؤال وجواب
- الأسئلة متنوعة (تعريفات، مفاهيم، تطبيقات)
- الإجابات واضحة ومختصرة

المحتوى:
${content}

أرجع النتيجة بصيغة JSON:
{
  "flashcards": [
    {"question": "السؤال", "answer": "الجواب"},
    ...
  ]
}`;

    const result = await this.generateContent(prompt, {
      temperature: 0.5,
      maxTokens: 4096
    });

    try {
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing flashcards JSON:', e);
    }
    
    return { flashcards: [] };
  },

  /**
   * Generate quiz in Arabic
   */
  async generateQuiz(content, options = {}) {
    const count = options.length === 'short' ? 5 : options.length === 'long' ? 15 : 10;
    
    const prompt = `أنشئ اختباراً من ${count} أسئلة باللغة العربية من المحتوى التالي.

المتطلبات:
- المستوى: ${options.level === 'beginner' ? 'مبتدئ' : options.level === 'advanced' ? 'متقدم' : 'متوسط'}
- أنواع الأسئلة: اختيار من متعدد (4 خيارات)
- كل سؤال له إجابة صحيحة واحدة
- أضف شرحاً للإجابة الصحيحة

المحتوى:
${content}

أرجع النتيجة بصيغة JSON:
{
  "quiz": {
    "title": "عنوان الاختبار",
    "questions": [
      {
        "question": "نص السؤال",
        "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
        "correctIndex": 0,
        "explanation": "شرح الإجابة"
      }
    ]
  }
}`;

    const result = await this.generateContent(prompt, {
      temperature: 0.5,
      maxTokens: 4096
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing quiz JSON:', e);
    }
    
    return { quiz: { title: '', questions: [] } };
  },

  /**
   * Generate mind map structure in Arabic
   */
  async generateMindMap(content, options = {}) {
    const prompt = `أنشئ خريطة ذهنية (Mind Map) باللغة العربية تلخص المحتوى التالي.

المتطلبات:
- موضوع رئيسي واحد
- 4-6 فروع رئيسية
- 2-4 فروع فرعية لكل فرع
- كلمات مفتاحية مختصرة

المحتوى:
${content}

أرجع النتيجة بصيغة JSON:
{
  "mindmap": {
    "title": "الموضوع الرئيسي",
    "branches": [
      {
        "name": "الفرع الرئيسي",
        "children": [
          {"name": "فرع فرعي 1"},
          {"name": "فرع فرعي 2"}
        ]
      }
    ]
  }
}`;

    const result = await this.generateContent(prompt, {
      temperature: 0.5,
      maxTokens: 2048
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing mindmap JSON:', e);
    }
    
    return { mindmap: { title: '', branches: [] } };
  },

  /**
   * Generate report in Arabic
   */
  async generateReport(content, options = {}) {
    const prompt = `اكتب تقريراً شاملاً باللغة العربية عن المحتوى التالي.

المتطلبات:
- الأسلوب: ${options.style === 'formal' ? 'رسمي' : options.style === 'academic' ? 'أكاديمي' : 'عام'}
- المستوى: ${options.level === 'beginner' ? 'مبتدئ' : options.level === 'advanced' ? 'متقدم' : 'متوسط'}
- الطول: ${options.length === 'short' ? 'قصير' : options.length === 'long' ? 'طويل ومفصل' : 'متوسط'}

الهيكل المطلوب:
1. ملخص تنفيذي
2. مقدمة
3. الأقسام الرئيسية (حسب المحتوى)
4. النقاط المهمة
5. الخلاصة والتوصيات

المحتوى:
${content}

اكتب التقرير بصيغة Markdown:`;

    return this.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 6000
    });
  },

  /**
   * Generate slide deck content in Arabic
   */
  async generateSlides(content, options = {}) {
    const slideCount = options.length === 'short' ? 8 : options.length === 'long' ? 20 : 12;
    
    const prompt = `أنشئ محتوى عرض تقديمي من ${slideCount} شريحة باللغة العربية.

المتطلبات:
- المستوى: ${options.level === 'beginner' ? 'مبتدئ' : options.level === 'advanced' ? 'متقدم' : 'متوسط'}
- نقاط مختصرة في كل شريحة (3-5 نقاط)
- ملاحظات للمتحدث لكل شريحة

المحتوى:
${content}

أرجع النتيجة بصيغة JSON:
{
  "presentation": {
    "title": "عنوان العرض",
    "slides": [
      {
        "title": "عنوان الشريحة",
        "points": ["نقطة 1", "نقطة 2"],
        "speakerNotes": "ملاحظات للمتحدث"
      }
    ]
  }
}`;

    const result = await this.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 6000
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing slides JSON:', e);
    }
    
    return { presentation: { title: '', slides: [] } };
  },

  /**
   * Generate infographic content in Arabic
   */
  async generateInfographic(content, options = {}) {
    const prompt = `أنشئ محتوى إنفوجرافيك باللغة العربية يلخص المحتوى التالي.

المتطلبات:
- عنوان جذاب
- 5-7 نقاط رئيسية مع أيقونات مقترحة
- إحصائيات أو أرقام مهمة (إن وجدت)
- خلاصة في جملة واحدة

المحتوى:
${content}

أرجع النتيجة بصيغة JSON:
{
  "infographic": {
    "title": "العنوان",
    "subtitle": "العنوان الفرعي",
    "points": [
      {"icon": "📌", "title": "النقطة", "description": "الوصف"}
    ],
    "stats": [
      {"value": "85%", "label": "الوصف"}
    ],
    "conclusion": "الخلاصة"
  }
}`;

    const result = await this.generateContent(prompt, {
      temperature: 0.6,
      maxTokens: 2048
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing infographic JSON:', e);
    }
    
    return { infographic: { title: '', points: [], stats: [], conclusion: '' } };
  },

  /**
   * Extract text from image using Gemini Vision
   */
  async extractTextFromImage(imageBase64, mimeType) {
    const body = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          {
            text: 'استخرج كل النص الموجود في هذه الصورة بالعربية أو بلغته الأصلية. إذا كانت الصورة تحتوي على رسوم بيانية أو جداول، صفها بوضوح.'
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    };

    const result = await this.callGemini('/models/gemini-2.5-flash:generateContent', body);
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  /**
   * Process PDF content (text extraction)
   */
  async processPDFContent(base64Content) {
    const body = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Content
            }
          },
          {
            text: 'استخرج كل النص من هذا الملف PDF. حافظ على هيكل المحتوى والعناوين والفقرات.'
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8000
      }
    };

    const result = await this.callGemini('/models/gemini-2.5-flash:generateContent', body);
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  /**
   * Transcribe audio content
   */
  async transcribeAudio(audioBase64, mimeType) {
    const body = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: 'انسخ هذا الملف الصوتي إلى نص. إذا كان باللغة العربية، اكتب النص بالعربية. إذا كان بلغة أخرى، اكتب النص بلغته الأصلية ثم ترجمه إلى العربية.'
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8000
      }
    };

    const result = await this.callGemini('/models/gemini-2.5-flash:generateContent', body);
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
};

// Make API globally available
window.API = API;
