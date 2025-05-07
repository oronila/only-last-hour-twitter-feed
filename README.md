# X Vibe Replying

A Chrome extension that boosts your Twitter engagement by highlighting strategic replies using a local LLM via Ollama.

## 🚀 Quick Start

1. **Backend**
   ```bash
   cd server
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit `.env` to set your Ollama server URL & model
   python app.py
   ```
2. **Extension**
   - Open `chrome://extensions` in Chrome
   - Enable Developer Mode
   - Load unpacked → select the `extension/` folder

## 🔧 Features

- **Age Filter**: Hide or mark tweets older than X hours.
- **LLM Evaluation**: Green check or red X marks strategic vs. non-strategic replies.
- **Customizable**: Adjust filter hours, tweet actions, core prompt, and toggle evaluation.

## ⚙️ Configuration

- **.env** (in `server/`):
  ```
  OLLAMA_URL=http://localhost:11434
  OLLAMA_MODEL=qwen3
  ```
- **Popup Settings**: Filter hours, actions for old/bad tweets, custom prompt (must include `{tweet}`), enable/disable evaluation.

## 🤔 Troubleshooting

- **Server Errors**: Ensure Flask (`python app.py`) is running on the correct port.
- **Ollama Issues**: Verify Ollama server & model are accessible (`ollama list`).
- **Extension**: Reload in Chrome, inspect console for errors.

## 🗂️ Project Structure

```
.
├── extension/                # Chrome extension files
│   ├── background.js         # Handles communication with the server
│   ├── content.js            # Interacts with Twitter/X pages
│   ├── popup.html            # Popup UI
│   ├── popup.js              # Popup logic
│   ├── popup.css             # Popup styling
│   ├── manifest.json         # Extension manifest
│   └── images/               # Icons and badges
├── server/                   # Backend Flask server
│   ├── app.py                # Flask application logic
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (Ollama URL, Model)
└── README.md                 # This file
```

## 💡 Tips

- Don't set the age filter below **3 hours**; hiding too many tweets may trigger rate limits or cause Twitter to block your feed.
- Craft your custom prompt to fit your needs: include example tweets and replies that have worked for you.
- Limit yourself to **20 replies per hour** to avoid appearing spammy and risking temporary bans.
