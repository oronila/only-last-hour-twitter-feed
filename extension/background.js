chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[background.js] Received message:', message, 'from', sender);
  if (message.type === 'checkTweet') {
    console.log('[background.js] Forwarding tweet to server:', message.tweet);
    fetch('http://localhost:5002/check_tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet: message.tweet })
    })
      .then(res => {
        console.log('[background.js] Raw server response:', res);
        console.log('[background.js] Server response status:', res.status);
        if (!res.ok) {
          console.error('[background.js] Server response not OK:', res.statusText);
          // Try to read the response body even if not ok, for more error details
          return res.text().then(text => {
            console.error('[background.js] Server error response body:', text);
            throw new Error(`Server responded with ${res.status}: ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('[background.js] Server responded with parsed JSON data:', data);
        sendResponse({ data });
      })
      .catch(err => {
        console.error('[background.js] Error fetching or parsing from server:', err, err.stack);
        sendResponse({ error: err.toString() });
      });
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
}); 