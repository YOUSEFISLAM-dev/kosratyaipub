# Korasty AI - Flask Backend for PythonAnywhere

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import logging
from datetime import datetime
import base64

# Create Flask app
app = Flask(__name__)

# Configure CORS to allow requests from GitHub Pages
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],  # Allow all origins for GitHub Pages
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-API-Key"]
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Teacher AI System Prompt
TEACHER_SYSTEM_PROMPT = """أنت "المعلم الذكي" - مساعد تعليمي ذكي يتحدث العربية بطلاقة.

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
- قدم الاستشهادات عند الحاجة"""


def get_genai_model(api_key):
    """Configure and return a Gemini model"""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')


@app.route('/')
def home():
    """Root endpoint"""
    return jsonify({
        'service': 'Korasty AI Backend',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'chat': '/api/chat',
            'studio': '/api/studio/*'
        }
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'korasty-ai',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with the Teacher AI"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        message = data.get('message', '')
        context = data.get('context', '')
        history = data.get('history', [])
        
        if not message:
            return jsonify({'error': 'الرسالة مطلوبة'}), 400
        
        # Build the prompt
        full_context = TEACHER_SYSTEM_PROMPT
        if context:
            full_context += f"\n\nالمحتوى المتاح للرجوع إليه:\n{context}"
        else:
            full_context += "\n\nلا يوجد محتوى متاح حالياً."
        
        # Configure model
        model = get_genai_model(api_key)
        
        # Build chat history
        chat_history = []
        for msg in history[-10:]:  # Limit to last 10 messages
            role = 'user' if msg.get('role') == 'user' else 'model'
            chat_history.append({
                'role': role,
                'parts': [msg.get('content', '')]
            })
        
        # Create chat session
        chat = model.start_chat(history=chat_history)
        
        # Send message with context
        prompt = f"{full_context}\n\nسؤال المستخدم: {message}"
        response = chat.send_message(prompt)
        
        return jsonify({
            'success': True,
            'response': response.text,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({
            'error': str(e) or 'خطأ في المحادثة',
            'suggestion': 'تأكد من صحة مفتاح API وحاول مرة أخرى'
        }), 500


@app.route('/api/studio/audio', methods=['POST'])
def generate_audio():
    """Generate audio overview script"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        style_map = {
            'formal': 'رسمي',
            'academic': 'أكاديمي',
            'conversational': 'محادثة طبيعية'
        }
        level_map = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'advanced': 'متقدم'
        }
        length_map = {
            'short': 'قصير (2-3 دقائق)',
            'medium': 'متوسط (5-6 دقائق)',
            'long': 'طويل (8-10 دقائق)'
        }
        
        prompt = f"""اكتب نصاً للقراءة الصوتية (Audio Overview) باللغة العربية يلخص المحتوى التالي.

المتطلبات:
- اكتب بأسلوب {style_map.get(options.get('style', 'conversational'), 'محادثة طبيعية')}
- المستوى المستهدف: {level_map.get(options.get('level', 'intermediate'), 'متوسط')}
- الطول: {length_map.get(options.get('length', 'medium'), 'متوسط (5-6 دقائق)')}
- ابدأ بمقدمة جذابة
- قسّم المحتوى إلى أقسام واضحة
- اختم بخلاصة وأفكار رئيسية

المحتوى:
{content}

اكتب النص المناسب للقراءة الصوتية:"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        script = response.text
        
        # Estimate duration
        words = len(script.split())
        minutes = max(1, round(words / 150))
        
        return jsonify({
            'success': True,
            'type': 'audio',
            'data': {
                'script': script,
                'duration': f'~{minutes} دقيقة',
                'note': 'النص جاهز للتحويل إلى صوت باستخدام خدمة TTS'
            }
        })
        
    except Exception as e:
        logger.error(f"Audio generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء الملخص الصوتي'}), 500


@app.route('/api/studio/flashcards', methods=['POST'])
def generate_flashcards():
    """Generate flashcards"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        count_map = {'short': 10, 'medium': 20, 'long': 30}
        count = count_map.get(options.get('length', 'medium'), 20)
        
        level_map = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'advanced': 'متقدم'
        }
        
        prompt = f"""أنشئ {count} بطاقة تعليمية (Flashcards) باللغة العربية من المحتوى التالي.

المتطلبات:
- المستوى: {level_map.get(options.get('level', 'intermediate'), 'متوسط')}
- كل بطاقة تحتوي على سؤال وجواب
- الأسئلة متنوعة (تعريفات، مفاهيم، تطبيقات)
- الإجابات واضحة ومختصرة

المحتوى:
{content}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص إضافي):
{{"flashcards": [{{"question": "السؤال", "answer": "الجواب"}}]}}"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        result = parse_json_response(response.text)
        
        return jsonify({
            'success': True,
            'type': 'flashcards',
            'data': result.get('flashcards', [])
        })
        
    except Exception as e:
        logger.error(f"Flashcards generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء البطاقات التعليمية'}), 500


@app.route('/api/studio/quiz', methods=['POST'])
def generate_quiz():
    """Generate quiz"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        count_map = {'short': 5, 'medium': 10, 'long': 15}
        count = count_map.get(options.get('length', 'medium'), 10)
        
        level_map = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'advanced': 'متقدم'
        }
        
        prompt = f"""أنشئ اختباراً من {count} أسئلة باللغة العربية من المحتوى التالي.

المتطلبات:
- المستوى: {level_map.get(options.get('level', 'intermediate'), 'متوسط')}
- أنواع الأسئلة: اختيار من متعدد (4 خيارات)
- كل سؤال له إجابة صحيحة واحدة
- أضف شرحاً للإجابة الصحيحة

المحتوى:
{content}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص إضافي):
{{"quiz": {{"title": "عنوان الاختبار", "questions": [{{"question": "نص السؤال", "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], "correctIndex": 0, "explanation": "شرح الإجابة"}}]}}}}"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        result = parse_json_response(response.text)
        
        return jsonify({
            'success': True,
            'type': 'quiz',
            'data': result.get('quiz', {'title': '', 'questions': []})
        })
        
    except Exception as e:
        logger.error(f"Quiz generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء الاختبار'}), 500


@app.route('/api/studio/mindmap', methods=['POST'])
def generate_mindmap():
    """Generate mind map"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        prompt = f"""أنشئ خريطة ذهنية (Mind Map) باللغة العربية تلخص المحتوى التالي.

المتطلبات:
- موضوع رئيسي واحد
- 4-6 فروع رئيسية
- 2-4 فروع فرعية لكل فرع
- كلمات مفتاحية مختصرة

المحتوى:
{content}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص إضافي):
{{"mindmap": {{"title": "الموضوع الرئيسي", "branches": [{{"name": "الفرع الرئيسي", "children": [{{"name": "فرع فرعي 1"}}, {{"name": "فرع فرعي 2"}}]}}]}}}}"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        result = parse_json_response(response.text)
        
        return jsonify({
            'success': True,
            'type': 'mindmap',
            'data': result.get('mindmap', {'title': '', 'branches': []})
        })
        
    except Exception as e:
        logger.error(f"Mind map generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء الخريطة الذهنية'}), 500


@app.route('/api/studio/report', methods=['POST'])
def generate_report():
    """Generate report"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        style_map = {
            'formal': 'رسمي',
            'academic': 'أكاديمي',
            'conversational': 'عام'
        }
        level_map = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'advanced': 'متقدم'
        }
        length_map = {
            'short': 'قصير',
            'medium': 'متوسط',
            'long': 'طويل ومفصل'
        }
        
        prompt = f"""اكتب تقريراً شاملاً باللغة العربية عن المحتوى التالي.

المتطلبات:
- الأسلوب: {style_map.get(options.get('style', 'conversational'), 'عام')}
- المستوى: {level_map.get(options.get('level', 'intermediate'), 'متوسط')}
- الطول: {length_map.get(options.get('length', 'medium'), 'متوسط')}

الهيكل المطلوب:
1. ملخص تنفيذي
2. مقدمة
3. الأقسام الرئيسية (حسب المحتوى)
4. النقاط المهمة
5. الخلاصة والتوصيات

المحتوى:
{content}

اكتب التقرير بصيغة Markdown:"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'type': 'report',
            'data': {'markdown': response.text}
        })
        
    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء التقرير'}), 500


@app.route('/api/studio/slides', methods=['POST'])
def generate_slides():
    """Generate slide deck"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        count_map = {'short': 8, 'medium': 12, 'long': 20}
        slide_count = count_map.get(options.get('length', 'medium'), 12)
        
        level_map = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'advanced': 'متقدم'
        }
        
        prompt = f"""أنشئ محتوى عرض تقديمي من {slide_count} شريحة باللغة العربية.

المتطلبات:
- المستوى: {level_map.get(options.get('level', 'intermediate'), 'متوسط')}
- نقاط مختصرة في كل شريحة (3-5 نقاط)
- ملاحظات للمتحدث لكل شريحة

المحتوى:
{content}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص إضافي):
{{"presentation": {{"title": "عنوان العرض", "slides": [{{"title": "عنوان الشريحة", "points": ["نقطة 1", "نقطة 2"], "speakerNotes": "ملاحظات للمتحدث"}}]}}}}"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        result = parse_json_response(response.text)
        
        return jsonify({
            'success': True,
            'type': 'slides',
            'data': result.get('presentation', {'title': '', 'slides': []})
        })
        
    except Exception as e:
        logger.error(f"Slides generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء العرض التقديمي'}), 500


@app.route('/api/studio/infographic', methods=['POST'])
def generate_infographic():
    """Generate infographic content"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        prompt = f"""أنشئ محتوى إنفوجرافيك باللغة العربية يلخص المحتوى التالي.

المتطلبات:
- عنوان جذاب
- 5-7 نقاط رئيسية مع أيقونات مقترحة
- إحصائيات أو أرقام مهمة (إن وجدت)
- خلاصة في جملة واحدة

المحتوى:
{content}

أرجع النتيجة بصيغة JSON فقط (بدون أي نص إضافي):
{{"infographic": {{"title": "العنوان", "subtitle": "العنوان الفرعي", "points": [{{"icon": "📌", "title": "النقطة", "description": "الوصف"}}], "stats": [{{"value": "85%", "label": "الوصف"}}], "conclusion": "الخلاصة"}}}}"""

        model = get_genai_model(api_key)
        response = model.generate_content(prompt)
        result = parse_json_response(response.text)
        
        return jsonify({
            'success': True,
            'type': 'infographic',
            'data': result.get('infographic', {'title': '', 'points': [], 'stats': [], 'conclusion': ''})
        })
        
    except Exception as e:
        logger.error(f"Infographic generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء الإنفوجرافيك'}), 500


@app.route('/api/studio/video', methods=['POST'])
def generate_video():
    """Generate video overview content"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        content = data.get('content', '')
        options = data.get('options', {})
        
        if not content:
            return jsonify({'error': 'المحتوى مطلوب'}), 400
        
        # Generate script (similar to audio)
        style_map = {
            'formal': 'رسمي',
            'academic': 'أكاديمي',
            'conversational': 'محادثة طبيعية'
        }
        
        prompt_script = f"""اكتب نصاً للقراءة الصوتية (Video Overview) باللغة العربية يلخص المحتوى التالي.

المتطلبات:
- اكتب بأسلوب {style_map.get(options.get('style', 'conversational'), 'محادثة طبيعية')}
- ابدأ بمقدمة جذابة
- قسّم المحتوى إلى أقسام واضحة
- اختم بخلاصة وأفكار رئيسية

المحتوى:
{content}

اكتب النص:"""

        model = get_genai_model(api_key)
        script_response = model.generate_content(prompt_script)
        script = script_response.text
        
        return jsonify({
            'success': True,
            'type': 'video',
            'data': {
                'script': script,
                'note': 'المحتوى جاهز للتحويل إلى فيديو'
            }
        })
        
    except Exception as e:
        logger.error(f"Video generation error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في إنشاء محتوى الفيديو'}), 500


@app.route('/api/process/pdf', methods=['POST'])
def process_pdf():
    """Process PDF content using Gemini"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        base64_content = data.get('content', '')
        
        if not base64_content:
            return jsonify({'error': 'محتوى الملف مطلوب'}), 400
        
        model = get_genai_model(api_key)
        
        # Create content with PDF
        response = model.generate_content([
            {
                'mime_type': 'application/pdf',
                'data': base64_content
            },
            'استخرج كل النص من هذا الملف PDF. حافظ على هيكل المحتوى والعناوين والفقرات.'
        ])
        
        return jsonify({
            'success': True,
            'text': response.text
        })
        
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في معالجة الملف'}), 500


@app.route('/api/process/image', methods=['POST'])
def process_image():
    """Extract text from image using Gemini Vision"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        base64_content = data.get('content', '')
        mime_type = data.get('mimeType', 'image/jpeg')
        
        if not base64_content:
            return jsonify({'error': 'محتوى الصورة مطلوب'}), 400
        
        model = get_genai_model(api_key)
        
        response = model.generate_content([
            {
                'mime_type': mime_type,
                'data': base64_content
            },
            'استخرج كل النص الموجود في هذه الصورة بالعربية أو بلغته الأصلية. إذا كانت الصورة تحتوي على رسوم بيانية أو جداول، صفها بوضوح.'
        ])
        
        return jsonify({
            'success': True,
            'text': response.text
        })
        
    except Exception as e:
        logger.error(f"Image processing error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في معالجة الصورة'}), 500


@app.route('/api/process/audio', methods=['POST'])
def process_audio():
    """Transcribe audio using Gemini"""
    try:
        data = request.json
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'مفتاح API مطلوب'}), 400
        
        base64_content = data.get('content', '')
        mime_type = data.get('mimeType', 'audio/mpeg')
        
        if not base64_content:
            return jsonify({'error': 'محتوى الصوت مطلوب'}), 400
        
        model = get_genai_model(api_key)
        
        response = model.generate_content([
            {
                'mime_type': mime_type,
                'data': base64_content
            },
            'انسخ هذا الملف الصوتي إلى نص. إذا كان باللغة العربية، اكتب النص بالعربية. إذا كان بلغة أخرى، اكتب النص بلغته الأصلية ثم ترجمه إلى العربية.'
        ])
        
        return jsonify({
            'success': True,
            'text': response.text
        })
        
    except Exception as e:
        logger.error(f"Audio processing error: {str(e)}")
        return jsonify({'error': str(e) or 'خطأ في معالجة الصوت'}), 500


def parse_json_response(text):
    """Parse JSON from AI response"""
    import json
    import re
    
    try:
        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group())
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
    
    return {}


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'المسار غير موجود'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'خطأ في الخادم'}), 500


if __name__ == '__main__':
    # Run locally for testing
    app.run(host='0.0.0.0', port=5000, debug=True)
