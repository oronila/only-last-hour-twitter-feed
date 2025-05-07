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
  const pendingBadge = document.createElement('div');
  pendingBadge.innerText = '⏳';
  pendingBadge.style = 'position:absolute; top:5px; right:5px; font-size:14px;';
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
      if (response.error) throw new Error(response.error);
      const data = response.data;
      // Remove pending badge
      pendingBadge.remove();
      if (data.should_reply) {
        // Good to reply
        article.dataset.evalState = 'good';
        article.style.border = '2px solid #1da1f2';
        const badge = document.createElement('div');
        badge.innerText = '✅';
        badge.title = 'Good to reply';
        badge.style = 'position:absolute; top:5px; right:5px; background:#1da1f2; color:#fff; padding:2px 4px; border-radius:3px; font-size:12px;';
        article.appendChild(badge);
      } else {
        // Not recommended
        article.dataset.evalState = 'bad';
        article.style.border = '2px solid #ccc';
        const badge = document.createElement('div');
        badge.innerText = '❌';
        badge.title = 'Not recommended to reply';
        badge.style = 'position:absolute; top:5px; right:5px; background:#ccc; color:#000; padding:2px 4px; border-radius:3px; font-size:12px;';
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