chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkTweet') {
    fetch('http://localhost:5003/check_tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet: message.tweet })
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
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
}); 