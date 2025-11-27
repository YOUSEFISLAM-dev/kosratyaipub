# Korasty AI - Backend (PythonAnywhere)

مساعد التعلم الذكي - الخادم الخلفي

## 🚀 Deployment to PythonAnywhere

### الخطوة 1: إنشاء حساب PythonAnywhere
1. اذهب إلى [PythonAnywhere](https://www.pythonanywhere.com/)
2. أنشئ حساباً مجانياً (Beginner account)
3. سجل الدخول

### الخطوة 2: رفع الملفات
1. اذهب إلى "Files" في Dashboard
2. أنشئ مجلداً جديداً: `korasty-ai-backend`
3. ارفع الملفات التالية:
   - `app.py`
   - `wsgi.py`
   - `requirements.txt`

### الخطوة 3: إعداد Virtual Environment
1. افتح "Consoles" واختر "Bash console"
2. نفذ الأوامر التالية:

```bash
# إنشاء بيئة افتراضية
mkvirtualenv --python=/usr/bin/python3.10 korasty-env

# الانتقال لمجلد المشروع
cd korasty-ai-backend

# تثبيت المكتبات
pip install -r requirements.txt
```

### الخطوة 4: إعداد Web App
1. اذهب إلى "Web" في Dashboard
2. اضغط "Add a new web app"
3. اختر "Manual configuration"
4. اختر Python 3.10

### الخطوة 5: تعديل إعدادات WSGI
1. في صفحة Web app، اضغط على رابط "WSGI configuration file"
2. استبدل المحتوى بـ:

```python
import sys
import os

# Add project directory to path
project_home = '/home/YOUR_USERNAME/korasty-ai-backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import Flask app
from app import app as application
```

**ملاحظة:** استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك

### الخطوة 6: تعيين Virtual Environment
في صفحة Web app:
- في قسم "Virtualenv"
- أدخل المسار: `/home/YOUR_USERNAME/.virtualenvs/korasty-env`

### الخطوة 7: إعادة تحميل التطبيق
اضغط زر "Reload" الأخضر في أعلى الصفحة

## 🔗 رابط الخادم

بعد الانتهاء، رابط API سيكون:
```
https://YOUR_USERNAME.pythonanywhere.com
```

## 📁 بنية الملفات

```
backend/
├── app.py              # تطبيق Flask الرئيسي
├── wsgi.py             # نقطة دخول WSGI
└── requirements.txt    # المكتبات المطلوبة
```

## 🔌 نقاط API المتاحة

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/` | GET | معلومات الخادم |
| `/api/health` | GET | فحص الصحة |
| `/api/chat` | POST | المحادثة مع المعلم الذكي |
| `/api/studio/audio` | POST | إنشاء ملخص صوتي |
| `/api/studio/flashcards` | POST | إنشاء بطاقات تعليمية |
| `/api/studio/quiz` | POST | إنشاء اختبار |
| `/api/studio/mindmap` | POST | إنشاء خريطة ذهنية |
| `/api/studio/report` | POST | إنشاء تقرير |
| `/api/studio/slides` | POST | إنشاء عرض تقديمي |
| `/api/studio/infographic` | POST | إنشاء إنفوجرافيك |
| `/api/studio/video` | POST | إنشاء محتوى فيديو |
| `/api/process/pdf` | POST | معالجة PDF |
| `/api/process/image` | POST | معالجة صورة |
| `/api/process/audio` | POST | معالجة صوت |

## 📝 مثال طلب API

```javascript
// Chat request
fetch('https://YOUR_USERNAME.pythonanywhere.com/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_GEMINI_API_KEY'
    },
    body: JSON.stringify({
        message: 'ما هي الفكرة الرئيسية؟',
        context: 'محتوى المصادر...',
        history: []
    })
})
```

## ⚠️ ملاحظات مهمة

### حدود الحساب المجاني
- CPU seconds محدودة يومياً
- عدد طلبات محدود
- التطبيق ينام بعد فترة عدم نشاط

### الأمان
- مفتاح API يُرسل من Frontend في كل طلب
- CORS مُفعّل لجميع المصادر
- لا يتم تخزين أي بيانات على الخادم

### تحديث الكود
1. ارفع الملفات الجديدة في Files
2. اضغط "Reload" في صفحة Web

## 🔧 تشغيل محلي للاختبار

```bash
# تثبيت المكتبات
pip install -r requirements.txt

# تشغيل الخادم
python app.py
```

الخادم سيعمل على: `http://localhost:5000`

## 🔗 روابط مفيدة

- [PythonAnywhere Help](https://help.pythonanywhere.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Google AI Python SDK](https://ai.google.dev/tutorials/python_quickstart)
