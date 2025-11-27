# 🎓 Korasty AI — منصة التعلم الذكي

<div dir="rtl">

منصة تعليمية ذكية تحول موادك الدراسية إلى مساعد تعلم تفاعلي وأدوات دراسية جاهزة باللغة العربية.

</div>

![Korasty AI Banner](https://via.placeholder.com/1200x400/e8f4ff/071426?text=Korasty+AI)

## ✨ Features

### 📚 Smart Content Ingestion
- **Upload Support**: PDF, TXT, Markdown, MP3, and all common image formats
- **Automatic Processing**: OCR for images, PDF text extraction, audio transcription
- **Arabic-First**: Built for Arabic content with RTL support

### 🤖 Teacher AI (المعلم الذكي)
- Conversational AI assistant specialized in curriculum explanation
- Context-aware answers that cite your uploaded materials
- Supports follow-up questions and multi-turn conversations

### 🎨 Studio Tools
Generate study materials in Arabic using Google AI Studio:

| Tool | Description | Output |
|------|-------------|--------|
| 🎧 Audio Overview | Narrated summary of your content | Script/MP3 |
| 🎬 Video Overview | Visual summary with slides | Script + Slides |
| 🧠 Mind Map | Interactive hierarchical topic structure (jsMind) | Interactive Canvas |
| 📄 Reports | Comprehensive study reports | Markdown/PDF |
| 🃏 Flashcards | Q&A pairs for spaced repetition | CSV/Anki |
| ❓ Quiz | Multiple-choice assessments | JSON |
| 📊 Infographic | Visual summary content | JSON/PNG |
| 📽️ Slide Deck | Presentation with speaker notes | JSON/PPTX |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google AI Studio API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/korasty-ai.git
cd korasty-ai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your Google AI API key to .env
# GOOGLE_AI_API_KEY=your_key_here

# Start the server
npm start
```

### Development Mode

```bash
# Run with auto-reload
npm run dev

# Or serve frontend only
npm run frontend
```

The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
korasty-ai/
├── src/
│   ├── frontend/           # Web UI
│   │   ├── index.html      # Main HTML
│   │   ├── css/            # Styles
│   │   │   ├── styles.css      # Main styles
│   │   │   └── components.css  # Component styles
│   │   └── js/             # JavaScript modules
│   │       ├── config.js       # Configuration
│   │       ├── utils.js        # Utilities
│   │       ├── storage.js      # Local storage
│   │       ├── api.js          # API client
│   │       ├── fileHandler.js  # File handling
│   │       ├── chat.js         # Chat module
│   │       ├── studio.js       # Studio tools
│   │       └── app.js          # Main app
│   │
│   └── backend/            # Node.js API
│       ├── server.js       # Express server
│       ├── config/         # Configuration
│       ├── routes/         # API routes
│       │   ├── upload.js       # File upload
│       │   ├── chat.js         # Chat API
│       │   ├── studio.js       # Studio generation
│       │   └── health.js       # Health checks
│       └── services/       # Business logic
│           ├── googleAI.js     # Google AI integration
│           ├── studio.js       # Studio generation
│           └── logger.js       # Logging
│
├── uploads/                # Uploaded files
├── .env.example           # Environment template
├── package.json           # Dependencies
└── README.md              # Documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `GOOGLE_AI_API_KEY` | Google AI Studio API key | Required |
| `GEMINI_MODEL` | Gemini model to use | gemini-2.5-flash |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 104857600 |
| `LOG_LEVEL` | Logging level | info |

### Frontend Configuration

Edit `src/frontend/js/config.js` to customize:
- Supported file formats
- Studio tool settings
- UI constants
- Teacher AI prompts

## 🌐 API Reference

### Upload
```
POST /api/upload
Content-Type: multipart/form-data
X-API-Key: your_api_key

Response: { success: true, file: { id, name, extractedText, ... } }
```

### Chat
```
POST /api/chat
Content-Type: application/json
X-API-Key: your_api_key

Body: { message: "...", context: "...", history: [...] }
Response: { success: true, response: "..." }
```

### Studio Generation
```
POST /api/studio/{tool}
Content-Type: application/json
X-API-Key: your_api_key

Body: { content: "...", options: { length, level, style } }
Response: { success: true, type: "...", data: {...} }

Tools: audio, flashcards, quiz, mindmap, report, slides, infographic, video
```

## 🎨 UI Design

Korasty AI features a **Liquid Glass** design language:
- Frosted glass panels with blur effects
- Soft gradients and shadows
- Smooth animations and transitions
- RTL-first Arabic typography
- Responsive three-panel layout

## 📝 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + U` | Upload file |
| `/` | Focus search |
| `Escape` | Close modals |
| `Ctrl + Enter` | Send chat message |

## 🔒 Security

- Helmet.js for HTTP security headers
- Rate limiting on API endpoints
- File type validation
- API key authentication
- CORS configuration

## 🛠️ Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS3 with CSS Variables
- Google Fonts (Inter, Tajawal)

**Backend:**
- Node.js + Express
- Google AI SDK (@google/generative-ai)
- Multer for file uploads
- Winston for logging

## 📋 Supported File Formats

| Category | Formats |
|----------|---------|
| Documents | `.pdf`, `.txt`, `.md` |
| Audio | `.mp3`, `.wav`, `.ogg`, `.m4a` |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.bmp`, `.tiff`, `.heic`, `.heif` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Feature Documentation

- [Mind Map Implementation Guide](MINDMAP_FEATURE.md) - Detailed documentation for the interactive mind map feature using jsMind

## 🙏 Acknowledgments

- [Google AI Studio](https://aistudio.google.com/) for Gemini AI models
- [jsMind](https://github.com/hizzgdev/jsmind) for interactive mind map visualization
- Design inspired by Apple's Liquid Glass aesthetic
- Built with ❤️ for Arabic-speaking learners

---

<div align="center">
  <strong>🎓 Korasty AI — Your Smart Learning Assistant</strong>
  <br>
  <sub>Transforming education with AI, one student at a time.</sub>
</div>
