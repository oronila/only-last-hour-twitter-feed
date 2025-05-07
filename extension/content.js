const oneHourAgoMS = 1000 * 60 * 60 * 6;

function processTweet(article) {
  // Skip tweets without timestamp (e.g. ads)
  const timeEl = article.querySelector('time');
  if (!timeEl) return;
  const tweetTime = Date.parse(timeEl.getAttribute('datetime'));
  if (tweetTime < Date.now() - oneHourAgoMS) {
    article.style.display = 'none';
    return;
  }

  // Ensure recent tweets are visible
  article.style.display = '';
  // Skip if already processed
  if (article.dataset.evalState) return;
  article.dataset.evalState = 'pending';

  // Add pending badge
  const pendingBadge = document.createElement('img');
  pendingBadge.src = chrome.runtime.getURL('images/hourglass-clipart.png');
  pendingBadge.title = 'Evaluating tweet...';
  pendingBadge.style = 'position:absolute; top:5px; right:5px; width:16px; height:16px;';
  article.style.position = 'relative';
  article.appendChild(pendingBadge);

  // Extract tweet text
  const contentEl = article.querySelector('div[lang]');
  const tweetText = contentEl ? contentEl.innerText : '';
  if (!tweetText) return;

  console.log('[content.js] sending checkTweet for:', tweetText);
  // Send to server for evaluation
  chrome.runtime.sendMessage(
    { type: 'checkTweet', tweet: tweetText },
    (response) => {
      console.log('[content.js] Received response from background:', response);
      if (chrome.runtime.lastError) {
        console.error('[content.js] chrome.runtime.lastError:', chrome.runtime.lastError.message);
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.title = 'Error: ' + chrome.runtime.lastError.message;
        article.dataset.evalState = 'error';
        return;
      }
      if (!response) {
        console.error('[content.js] Received undefined response from background.js');
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.title = 'Error: No response from background script.';
        article.dataset.evalState = 'error';
        return;
      }
      if (response.error) {
        console.error('[content.js] Error from background script:', response.error);
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.title = 'Error: ' + response.error;
        article.dataset.evalState = 'error';
        return;
      }
      const data = response.data;
      // Remove pending badge
      pendingBadge.remove();
      if (data.should_reply) {
        // Good to reply
        article.dataset.evalState = 'good';
        article.style.border = '2px solid #1da1f2';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/Eo_circle_green_white_checkmark.svg.png');
        badge.title = data.reason || 'Good to reply';
        badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px; background:#fff; border-radius:50%;';
        article.appendChild(badge);
      } else {
        // Not recommended
        article.dataset.evalState = 'bad';
        article.style.border = '2px solid #ccc';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/Red_X.svg.png');
        badge.title = data.reason || 'Not recommended to reply';
        badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px;';
        article.appendChild(badge);
      }
    }
  );
}

function scanTimeline() {
  document.querySelectorAll('article').forEach(processTweet);
}

function init() {
  console.log('[content.js] init called');
  scanTimeline();
  const timeline = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
  if (timeline) {
    const observer = new MutationObserver(scanTimeline);
    observer.observe(timeline, {childList: true, subtree: true});
  } else {
    setTimeout(init, 2000);
  }
}

init(); 