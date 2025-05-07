let customTooltip = null;
let currentFilterMilliseconds = 1 * 60 * 60 * 1000; // Default to 1 hour
let currentOldTweetAction = 'hide'; // Default action
let currentBadTweetAction = 'mark'; // Default action for bad tweets
let currentIsEvaluationEnabled = true; // Default to true

function ensureTooltipExists() {
  if (!customTooltip) {
    customTooltip = document.createElement('div');
    customTooltip.style.position = 'fixed';
    customTooltip.style.display = 'none';
    customTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    customTooltip.style.color = '#fff';
    customTooltip.style.padding = '10px 15px';
    customTooltip.style.borderRadius = '8px';
    customTooltip.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    customTooltip.style.fontSize = '14px';
    customTooltip.style.lineHeight = '1.5';
    customTooltip.style.zIndex = '2147483647';
    customTooltip.style.maxWidth = '300px';
    customTooltip.style.pointerEvents = 'none';
    customTooltip.style.textAlign = 'left';
    customTooltip.style.wordBreak = 'break-word';
    document.body.appendChild(customTooltip);
  }
}

function showTooltip(targetElement, text) {
  ensureTooltipExists();
  customTooltip.innerText = text;

  customTooltip.style.visibility = 'hidden';
  customTooltip.style.display = 'block';

  const targetRect = targetElement.getBoundingClientRect();
  const tooltipWidth = customTooltip.offsetWidth;
  const tooltipHeight = customTooltip.offsetHeight;

  let newTop = targetRect.bottom + 8;
  let newLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

  if (newLeft < 5) newLeft = 5;
  if (newLeft + tooltipWidth > window.innerWidth - 5) {
    newLeft = window.innerWidth - tooltipWidth - 5;
  }

  if (newTop + tooltipHeight > window.innerHeight - 5) {
    newTop = targetRect.top - tooltipHeight - 8;
  }
  if (newTop < 5) {
    newTop = 5;
  }

  customTooltip.style.top = `${newTop}px`;
  customTooltip.style.left = `${newLeft}px`;
  customTooltip.style.visibility = 'visible';
}

function hideTooltip() {
  if (customTooltip) {
    customTooltip.style.display = 'none';
  }
}

function addOrUpdateHoverTooltip(element, textOrProvider) {
    if (element.customMouseEnterHandler) {
        element.removeEventListener('mouseenter', element.customMouseEnterHandler);
    }
    if (element.customMouseLeaveHandler) { 
        element.removeEventListener('mouseleave', element.customMouseLeaveHandler);
    }

    const mouseEnterHandler = (event) => {
        const text = typeof textOrProvider === 'function' ? textOrProvider() : textOrProvider;
        showTooltip(event.target, text);
    };
    
    element.customMouseEnterHandler = mouseEnterHandler;
    element.customMouseLeaveHandler = hideTooltip;

    element.addEventListener('mouseenter', element.customMouseEnterHandler);
    element.addEventListener('mouseleave', element.customMouseLeaveHandler);
}

function loadSettingsAndScanTweets() {
  chrome.storage.sync.get([
    'filterHours', 
    'oldTweetAction', 
    'badTweetAction', 
    'customPrompt',
    'isEvaluationEnabled'
  ], (data) => {
    let newFilterHours = 1;
    if (data.filterHours !== undefined) {
      newFilterHours = parseInt(data.filterHours, 10);
    }
    currentOldTweetAction = data.oldTweetAction || 'hide';
    currentBadTweetAction = data.badTweetAction || 'mark';
    currentIsEvaluationEnabled = data.isEvaluationEnabled !== undefined ? data.isEvaluationEnabled : true;

    if (newFilterHours <= 0) {
      currentFilterMilliseconds = -1;
    } else {
      currentFilterMilliseconds = newFilterHours * 60 * 60 * 1000;
    }
    
    document.querySelectorAll('article').forEach(article => {
      article.style.display = '';
      article.dataset.evalState = '';
      if (!currentIsEvaluationEnabled) {
        const llmBadges = article.querySelectorAll('img[alt*="Evaluating"], img[alt*="Good to reply"], img[alt*="Not recommended"], img[alt*="Error"]');
        llmBadges.forEach(b => b.remove());
      }
    });
    scanTimeline();
  });
}

function processTweet(article) {
  ensureTooltipExists();

  if (article.dataset.evalState === 'old_marked' && currentOldTweetAction === 'mark') {
    article.style.display = '';
    return;
  }

  const timeEl = article.querySelector('time');
  if (!timeEl) return;
  const tweetTime = Date.parse(timeEl.getAttribute('datetime'));

  if (currentFilterMilliseconds !== -1 && tweetTime < Date.now() - currentFilterMilliseconds) {
    if (currentOldTweetAction === 'hide') {
      article.style.display = 'none';
    } else {
      article.style.display = '';
      const existingBadge = article.querySelector('img[alt*="Evaluating"], img[alt*="Good to reply"], img[alt*="Not recommended"], img[alt*="Error"]');
      if (existingBadge) existingBadge.remove();

      const badge = document.createElement('img');
      badge.src = chrome.runtime.getURL('images/redX.png');
      const reasonText = 'Outside preferred timeframe';
      badge.alt = reasonText;
      addOrUpdateHoverTooltip(badge, reasonText);
      badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px;';
      article.style.position = 'relative';
      if (!article.contains(badge)) {
          article.appendChild(badge);
      }
      article.dataset.evalState = 'old_marked';
    }
    return;
  }

  if (article.dataset.evalState === 'old_marked') {
    const oldBadge = article.querySelector('img[alt="Outside preferred timeframe"]');
    if (oldBadge) oldBadge.remove();
    article.dataset.evalState = '';
  }
  article.style.display = '';

  if (!currentIsEvaluationEnabled) {
    const llmBadges = article.querySelectorAll('img[alt*="Evaluating"], img[alt*="Good to reply"], img[alt*="Not recommended"], img[alt*="Error"]');
    llmBadges.forEach(b => b.remove());
    return;
  }

  if (article.dataset.evalState && article.dataset.evalState !== 'pending') return;
  if (article.dataset.evalState === 'pending') return;

  article.dataset.evalState = 'pending';

  const pendingBadge = document.createElement('img');
  pendingBadge.src = chrome.runtime.getURL('images/loadingIcon.png');
  pendingBadge.alt = 'Evaluating tweet...';
  addOrUpdateHoverTooltip(pendingBadge, 'Evaluating tweet...');
  pendingBadge.style = 'position:absolute; top:5px; right:5px; width:16px; height:16px;';
  article.style.position = 'relative';
  article.appendChild(pendingBadge);

  const contentEl = article.querySelector('div[lang]');
  const tweetText = contentEl ? contentEl.innerText : '';
  if (!tweetText) return;

  chrome.runtime.sendMessage(
    { type: 'checkTweet', tweet: tweetText },
    (response) => {
      if (chrome.runtime.lastError) {
        pendingBadge.src = chrome.runtime.getURL('images/errorIcon.png');
        pendingBadge.alt = 'Error: Make sure the flask server is running.';
        addOrUpdateHoverTooltip(pendingBadge, 'Error: Make sure the flask server is running.');
        article.dataset.evalState = 'error';
        return;
      }
      if (!response) {
        pendingBadge.src = chrome.runtime.getURL('images/errorIcon.png');
        pendingBadge.alt = 'Error: No response from background script.';
        addOrUpdateHoverTooltip(pendingBadge, 'Error: No response from background script.');
        article.dataset.evalState = 'error';
        return;
      }
      if (response.error) {
        pendingBadge.src = chrome.runtime.getURL('images/errorIcon.png');
        pendingBadge.alt = 'Error: ' + response.error;
        addOrUpdateHoverTooltip(pendingBadge, 'Error: ' + response.error);
        article.dataset.evalState = 'error';
        return;
      }

      const data = response.data;

      if (data.should_reply) {
        pendingBadge.remove();
        article.dataset.evalState = 'good';
        article.style.border = '2px solid #1da1f2';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/greenCheck.png');
        const reasonText = data.reason || 'Good to reply';
        badge.alt = reasonText;
        addOrUpdateHoverTooltip(badge, reasonText);
        badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px; background:#fff; border-radius:50%;';
        if (!article.contains(badge)) {
            article.appendChild(badge);
        }
      } else {
        pendingBadge.remove();
        if (currentBadTweetAction === 'hide') {
          article.style.display = 'none';
          article.dataset.evalState = 'bad_hidden';
          const existingBadges = article.querySelectorAll('img[alt*="Evaluating"], img[alt*="Good to reply"], img[alt*="Not recommended"], img[alt*="Error"], img[alt*="Outside preferred timeframe"]');
          existingBadges.forEach(b => b.remove());
        } else {
          article.style.display = '';
          article.dataset.evalState = 'bad';
          article.style.border = '2px solid #ccc';
          const badge = document.createElement('img');
          badge.src = chrome.runtime.getURL('images/redX.png');
          const reasonText = data.reason || 'Not recommended to reply';
          badge.alt = reasonText;
          addOrUpdateHoverTooltip(badge, reasonText);
          badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px;';
          const existingBadges = article.querySelectorAll('img[alt*="Evaluating"], img[alt*="Good to reply"], img[alt*="Error"], img[alt*="Outside preferred timeframe"]');
          existingBadges.forEach(b => b.remove());
          if (!article.contains(badge)) {
            article.appendChild(badge);
          }
        }
      }
    }
  );
}

function scanTimeline() {
  document.querySelectorAll('article').forEach(processTweet);
}

function init() {
  loadSettingsAndScanTweets(); // Use renamed function

  const timeline = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
  if (timeline) {
    const observer = new MutationObserver(scanTimeline);
    observer.observe(timeline, {childList: true, subtree: true});
  } else {
    setTimeout(init, 2000); // Retry initialization if timeline not found
  }
}

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.filterHours || changes.oldTweetAction || changes.badTweetAction || changes.isEvaluationEnabled || changes.customPrompt)) { // Listen to all relevant changes
    loadSettingsAndScanTweets();
  }
});

init(); 