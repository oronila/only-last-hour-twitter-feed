const oneHourAgoMS = 1000 * 60 * 60 * 6;

let customTooltip = null;

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

function processTweet(article) {
  ensureTooltipExists();
  const timeEl = article.querySelector('time');
  if (!timeEl) return;
  const tweetTime = Date.parse(timeEl.getAttribute('datetime'));
  if (tweetTime < Date.now() - oneHourAgoMS) {
    article.style.display = 'none';
    return;
  }

  article.style.display = '';
  if (article.dataset.evalState) return;
  article.dataset.evalState = 'pending';

  const pendingBadge = document.createElement('img');
  pendingBadge.src = chrome.runtime.getURL('images/hourglass-clipart.png');
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
        const errorText = 'Error: Make sure the flask server is running.';
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText);
        article.dataset.evalState = 'error';
        return;
      }
      if (!response) {
        const errorText = 'Error: No response from background script.';
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText);
        article.dataset.evalState = 'error';
        return;
      }
      if (response.error) {
        const errorText = 'Error: ' + response.error;
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText);
        article.dataset.evalState = 'error';
        return;
      }
      const data = response.data;
      pendingBadge.remove();
      if (data.should_reply) {
        article.dataset.evalState = 'good';
        article.style.border = '2px solid #1da1f2';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/Eo_circle_green_white_checkmark.svg.png');
        const reasonText = data.reason || 'Good to reply';
        badge.alt = reasonText;
        addOrUpdateHoverTooltip(badge, reasonText);
        badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px; background:#fff; border-radius:50%;';
        article.appendChild(badge);
      } else {
        article.dataset.evalState = 'bad';
        article.style.border = '2px solid #ccc';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/Red_X.svg.png');
        const reasonText = data.reason || 'Not recommended to reply';
        badge.alt = reasonText;
        addOrUpdateHoverTooltip(badge, reasonText);
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