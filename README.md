# X Vibe Replying - Chrome Extension

This Chrome extension enhances your Twitter/X experience by analyzing tweets in your timeline and providing strategic insights on whether to reply for audience growth and engagement, powered by a local LLM via Ollama. It also offers robust filtering options to customize your feed.

## Features

*   **LLM-Powered Reply Suggestions**: Get AI-driven advice on which tweets are strategic to reply to.
*   **Customizable Tweet Filtering**:
    *   Filter tweets by age (e.g., hide tweets older than X hours).
    *   Choose how to handle old tweets (hide or mark).
*   **Customizable Evaluation Handling**:
    *   Choose how to handle tweets deemed non-strategic for reply (hide or mark).
*   **Customizable LLM Prompt**: Advanced users can customize the core instruction sent to the LLM for tweet evaluation.
*   **Easy-to-Use Popup Interface**: Manage all settings through the extension popup.

## Prerequisites

*   **Python 3.x**: Download from [python.org](https://www.python.org/)
*   **pip** (Python package installer, usually comes with Python)
*   **Ollama**: Ensure Ollama is installed and running.
    *   Download from [ollama.com](https://ollama.com/).
    *   Pull a model that supports JSON output. This project defaults to `qwen3` but can be configured. You can pull a model by running:
        ```bash
        ollama pull qwen3
        ```
        (Or any other compatible model like `llama3`, `mistral`, etc.)

## Setup Instructions

### 1. Backend Server (Flask)

The backend server processes tweet evaluation requests using Ollama.

1.  **Navigate to the Server Directory**:
    ```bash
    cd server
    ```

2.  **Create a Virtual Environment (Recommended)**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `server` directory by copying the example below or creating it from scratch:
    ```
    OLLAMA_URL=http://localhost:11434
    OLLAMA_MODEL=qwen3
    ```
    *   `OLLAMA_URL`: The URL where your Ollama server is running (default is `http://localhost:11434`).
    *   `OLLAMA_MODEL`: The Ollama model to use for evaluations (e.g., `qwen3`, `llama3`). Make sure this model is available in your Ollama installation.

5.  **Run the Flask Server**:
    ```bash
    python app.py
    ```
    The server will start, typically on `http://localhost:5004`. You should see output indicating it's running. Keep this terminal window open while using the extension.

### 2. Frontend (Chrome Extension)

1.  **Open Chrome/Chromium**.
2.  Navigate to `chrome://extensions`.
3.  **Enable Developer Mode**: Toggle the switch usually found in the top-right corner.
4.  **Load the Extension**:
    *   Click the "**Load unpacked**" button.
    *   Navigate to the project's root directory and select the `extension` sub-directory.
5.  The "X Vibe Replying" extension should now appear in your list of extensions and be active.

## How to Use

1.  Once the Flask server is running and the extension is loaded in Chrome, navigate to [Twitter/X](https://twitter.com).
2.  Tweets in your timeline will be processed according to your settings.
    *   An hourglass icon indicates a tweet is being evaluated.
    *   A green checkmark indicates a tweet is good to reply to.
    *   A red X indicates a tweet is not recommended for reply or is outside your preferred timeframe.
3.  **Customize Settings**:
    *   Click the "X Vibe Replying" extension icon in your Chrome toolbar to open the popup.
    *   **Filter Hours**: Set how old tweets can be before they are acted upon (0 to show all).
    *   **Action for Old Tweets**: Choose to "Hide them" or "Mark as not recommended".
    *   **Action for Non-Strategic Tweets**: Choose to "Mark as not recommended" (default) or "Hide them".
    *   **Customize Prompt Core Instruction**: Modify the core instruction sent to the LLM. Ensure you include the `{tweet}` placeholder where the tweet text should be inserted.
    *   Click "**Save**" to apply your changes. The timeline should update based on the new settings.

## Troubleshooting

*   **Error icons on tweets / "Error: Make sure the flask server is running" tooltip**:
    *   Ensure the Python Flask server (`python app.py`) is running in your terminal.
    *   Check that the server is running on the correct port (`http://localhost:5004` as per the latest `app.py`). The extension's `background.js` should also point to this port.
    *   Verify Ollama is running.
*   **No response or errors from Ollama**:
    *   Ensure Ollama is running and accessible at the `OLLAMA_URL` specified in your `server/.env` file.
    *   Make sure the `OLLAMA_MODEL` specified in `server/.env` has been pulled into Ollama (`ollama list` to check available models).
    *   Some models might not strictly adhere to JSON output format requests; consider trying a different model if you consistently get parsing errors from the LLM's response.
*   **Extension popup settings not saving/loading**:
    *   Ensure Chrome's developer mode is enabled and the extension was loaded correctly.
    *   Check the Chrome extension console for errors (right-click the extension icon, "Manage extension", then "Inspect views: service worker" for background errors, or inspect the popup itself).

## Project Structure

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

This README should cover all the necessary steps.
