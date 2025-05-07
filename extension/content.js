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

  // Send to server for evaluation
  fetch('http://localhost:5000/check_tweet', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({tweet: tweetText}),
  })
    .then(res => res.json())
    .then(data => {
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
    })
    .catch(err => {
      // Remove pending badge and mark error
      pendingBadge.remove();
      article.dataset.evalState = 'error';
      const badge = document.createElement('div');
      badge.innerText = '⚠️';
      badge.title = 'Error evaluating tweet';
      badge.style = 'position:absolute; top:5px; right:5px; background:#f00; color:#fff; padding:2px 4px; border-radius:3px; font-size:12px;';
      article.appendChild(badge);
    });
}

function scanTimeline() {
  document.querySelectorAll('article').forEach(processTweet);
}

function init() {
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