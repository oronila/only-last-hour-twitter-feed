from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import openai
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

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
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150,
        )
        content = response.choices[0].message.content.strip()
        result = json.loads(content)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True) 