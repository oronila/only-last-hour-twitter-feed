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
    user_prompt_segment_template = data.get("user_prompt_segment") # This comes from background.js

    if not tweet:
        return jsonify({"error": "No tweet provided"}), 400

    strategic_examples = """
    Here are some examples of successful reply tweets: 

    Example 1:
    Tweet: "How do you think we should be pricing for very expensive models (o3) or ultra-long context windows (~100k LOC) in Cursor?

    API pricing, higher subscription tier, something else?"
    Reply: "higher subscription tier. i don't want to feel like i wasted money if i get a bad response from a per use api call"

    Tweet: "i've worked on a frontend project, i've also worked on a backend project 

    believe me when I say backend is harder than frontend"
    Reply: "until you have users complaining about the layout from 100 different perspectives"

    Tweet: "Cluely launches in <24 hours. 

    We're changing the definition of the word "cheating."

    This will be the most ambitious project of my life. 

    If we can accomplish what we set out to, we will change the course of human history.

    4/20/25 2PM PST
    @trycluely"

    Reply: "i hope this ushers in a new era of unstructured learning to empower the most ambitious rather than take us back and remove our access to online exams"
    """

    # Fixed parts of the prompt
    prompt_prefix = (
        f"You are an expert Twitter growth strategist. Your goal is to help me gain followers and maximize engagement, sometimes through engagement baiting. "
    )

    prompt_json_instructions = (
        "Respond with a JSON object containing three keys: "
        '"should_reply" (true or false based on its potential for my growth), '
        '"reason" (a brief explanation of why it is or isn\'t good for growth/engagement)'
    )

    # User-modifiable part, with default
    if user_prompt_segment_template and "{tweet}" in user_prompt_segment_template:
        # Replace placeholder in user's template with the actual tweet content
        # Ensure tweet content is properly escaped if it could break the f-string or JSON, though unlikely here for basic text replacement.
        # For direct replacement, str.replace is safer than f-string if tweet content is unknown.
        user_core_instruction = user_prompt_segment_template.replace("{tweet}", tweet)
    else:
        # Default core instruction if user's is missing, invalid, or doesn't contain {tweet}
        user_core_instruction = f"Given the following tweet, determine if it's a strategic one for me to reply to for audience growth. {tweet}"
    
    final_prompt = prompt_prefix + user_core_instruction + " " + prompt_json_instructions

    try:
        payload = {
            "model": os.getenv("OLLAMA_MODEL", "qwen3"),
            "messages": [
                {"role": "system", "content": "You are a helpful assistant acting as a Twitter growth strategist."},
                {"role": "user", "content": final_prompt} # Use the constructed final_prompt
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
    app.run(host='0.0.0.0', port=5005, debug=True) 