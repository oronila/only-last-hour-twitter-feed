chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkTweet') {
    const DEFAULT_CUSTOM_PROMPT_BG = "Given the following tweet, determine if it's a strategic one for me to reply to for audience growth. {tweet}";
    
    chrome.storage.sync.get('customPrompt', (storageData) => {
      const userPromptSegment = storageData.customPrompt || DEFAULT_CUSTOM_PROMPT_BG;
      
      fetch('http://localhost:5005/check_tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tweet: message.tweet,
          user_prompt_segment: userPromptSegment // Send the user's prompt segment
        })
      })
      .then(res => {
        if (!res.ok) {
          // Try to read the response body even if not ok, for more error details
          return res.text().then(text => {
            throw new Error(`Server responded with ${res.status}: ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        sendResponse({ data });
      })
      .catch(err => {
        sendResponse({ error: err.toString() });
      });
    });
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
}); 