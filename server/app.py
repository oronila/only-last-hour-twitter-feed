from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the extension

@app.route("/check_tweet", methods=["POST"])
def check_tweet():
    data = request.get_json()
    tweet = data.get("tweet", "")
    if not tweet:
        return jsonify({"error": "No tweet provided"}), 400

    prompt = (
        f"Given the following tweet, determine whether it is a good one to reply to. "
        "Respond with a JSON object containing two keys: \"should_reply\" (true or false) and \"reason\" (a brief explanation)."
        f"\n\nTweet: \"{tweet}\""
    )

    try:
        payload = {
            "model": os.getenv("OLLAMA_MODEL", "qwen3"),
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 150,
            "response_format": { "type": "json_object" }
        }
        resp = requests.post(f"{OLLAMA_URL}/v1/chat/completions", json=payload)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        print(f"Raw content from Ollama: '{content}'")
        result = json.loads(content)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True) 