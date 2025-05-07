chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[background.js] Received message:', message, 'from', sender);
  if (message.type === 'checkTweet') {
    console.log('[background.js] Forwarding tweet to server:', message.tweet);
    fetch('http://localhost:5000/check_tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet: message.tweet })
    })
      .then(res => {
        console.log('[background.js] Server response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[background.js] Server responded with data:', data);
        sendResponse({ data });
      })
      .catch(err => {
        console.error('[background.js] Error fetching from server:', err);
        sendResponse({ error: err.toString() });
      });
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
}); 