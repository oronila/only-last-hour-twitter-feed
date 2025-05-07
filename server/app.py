from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

app = Flask(__name__)
CORS(app)

@app.route("/check_tweet", methods=["POST"])
def check_tweet():
    data = request.get_json()
    tweet = data.get("tweet", "")
    if not tweet:
        return jsonify({"error": "No tweet provided"}), 400

    prompt = (
        f"You are an expert Twitter growth strategist. Your goal is to help me gain followers and maximize engagement, sometimes through engagement baiting. "
        f"Given the following tweet, determine if it's a strategic one for me to reply to for audience growth. Be picky with your replies, only reply to tweets that are strategic. "
        "Respond with a JSON object containing three keys: "
        '"should_reply" (true or false based on its potential for my growth), '
        '"reason" (a brief explanation of why it is or isn\'t good for growth/engagement)'
    )

    try:
        payload = {
            "model": os.getenv("OLLAMA_MODEL", "qwen3"),
            "messages": [
                {"role": "system", "content": "You are a helpful assistant acting as a Twitter growth strategist."},
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
    app.run(host='0.0.0.0', port=5002, debug=True) 