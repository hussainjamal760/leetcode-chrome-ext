# 🚀 LeetCode Auto Sync Chrome Extension

A production-grade Chrome extension that automatically syncs your LeetCode solutions to GitHub and Notion with AI-powered summaries.

## ✨ Features

- 🔄 **Automatic Sync**: One-click sync after solving LeetCode problems
- 📝 **GitHub Integration**: Push solutions to your repository with proper folder structure
- 📊 **Notion Database**: Track all solutions in a beautiful Notion database
- 🤖 **AI Summaries**: Generate solution summaries using OpenAI (your own API key)
- 🔒 **Secure**: API keys handled securely via backend, never exposed in frontend
- ⚡ **Fast**: Async operations with retry logic and error handling
- 🎨 **Beautiful UI**: Modern, responsive design
- 📈 **Scalable**: Modular architecture ready for production

## 🏗️ Architecture

```
[Chrome Extension] → [Backend API] → [GitHub API]
                                   → [Notion API]
                                   → [OpenAI API]
```

**Security First**: All external API calls go through the backend. No API keys in frontend code.

## 🎯 What Gets Synced

When you click "Sync Solution" after solving a problem:

1. **GitHub Repository**:
   - Creates folder: `/leetcode/{problem-slug}/`
   - Adds `solution.{ext}` with your code
   - Adds `README.md` with problem details and AI summary

2. **Notion Database**:
   - Problem title and difficulty
   - Language and tags
   - GitHub link
   - AI summary and complexity analysis
   - Submission date

3. **AI Summary** (optional):
   - Solution approach explanation
   - Time complexity analysis
   - Space complexity analysis

## 📦 Installation

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions.

### Quick Start

1. **Backend Setup**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

2. **Extension Setup**:
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

3. **Configure**:
   - Click extension icon → "Open Settings"
   - Enter backend URL and OpenAI API key
   - Save settings

## 🔑 Required Credentials

- **GitHub**: Personal Access Token with `repo` scope
- **Notion**: Integration token and database ID
- **OpenAI**: API key (optional, for AI summaries)

## 🎬 Usage

1. Solve a LeetCode problem
2. Submit and wait for "Accepted"
3. Click "Sync Solution" button
4. Done! Check GitHub and Notion

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- Axios for API calls
- Winston for logging
- Joi for validation
- Helmet for security
- Express Rate Limit

### Extension
- Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Content Scripts

### External APIs
- GitHub REST API
- Notion API
- OpenAI API

## 📁 Project Structure

```
├── backend/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── utils/            # Helper functions
│   └── server.js         # Entry point
├── extension/
│   ├── manifest.json     # Extension config
│   ├── content.js        # Injected into LeetCode
│   ├── background.js     # Service worker
│   ├── popup.html/js     # Extension popup
│   └── options.html/js   # Settings page
└── SETUP_GUIDE.md        # Detailed setup
```

## 🔒 Security Features

- ✅ No API keys in frontend code
- ✅ User API key used in memory only (not stored)
- ✅ Optional encryption for temporary storage
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Error handling without data leakage

## 🚀 Production Ready

- Modular, scalable architecture
- Comprehensive error handling
- Retry logic with exponential backoff
- Structured logging
- Environment-based configuration
- Ready for microservices migration

## 📊 Example Output

### GitHub Structure
```
leetcode-solutions/
└── leetcode/
    ├── two-sum/
    │   ├── solution.js
    │   └── README.md
    └── reverse-linked-list/
        ├── solution.py
        └── README.md
```

### Notion Database
| Title | Difficulty | Language | Tags | GitHub | Date |
|-------|-----------|----------|------|--------|------|
| Two Sum | Easy | JavaScript | Array, Hash Table | [Link] | 2024-01-01 |

## 🐛 Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting) for common issues and solutions.

## 📝 API Endpoints

- `POST /api/sync` - Sync solution
- `GET /api/validate` - Validate configuration
- `GET /health` - Health check

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- LeetCode for the amazing platform
- GitHub, Notion, and OpenAI for their APIs
- The open-source community

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the logs in `backend/logs/`
- Review the setup guide

---

**Made with ❤️ for LeetCode enthusiasts**

Happy coding! 🎉
