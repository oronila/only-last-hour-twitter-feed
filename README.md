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
├── extension/      # Chrome extension files
└── server/         # Flask backend
    ├── app.py
    ├── requirements.txt
    └── .env.example
```
