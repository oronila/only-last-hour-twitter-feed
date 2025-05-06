const oneHourAgoMS = 1000 * 60 * 60;

function processTweet(article) {
  // Hide ads or tweets without timestamp
  const timeEl = article.querySelector('time');
  if (!timeEl) { article.style.display = 'none'; return; }
  const tweetTime = Date.parse(timeEl.getAttribute('datetime'));
  if (tweetTime < Date.now() - oneHourAgoMS) {
    article.style.display = 'none';
    return;
  }

  // Only evaluate once
  if (article.dataset.evaluated) return;
  article.dataset.evaluated = 'true';

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
      if (data.should_reply) {
        // Highlight recommended tweets
        article.style.border = '2px solid #1da1f2';
        article.style.position = 'relative';
        const badge = document.createElement('div');
        badge.innerText = 'Good to reply';
        badge.style = 'position:absolute; top:5px; right:5px; background:#1da1f2; color:#fff; padding:2px 4px; border-radius:3px; font-size:12px;';
        article.appendChild(badge);
      }
    })
    .catch(err => console.error('Error evaluating tweet:', err));
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