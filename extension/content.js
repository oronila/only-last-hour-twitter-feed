const oneHourAgoMS = 1000 * 60 * 60 * 6;

// --- Custom Tooltip Implementation ---
let customTooltip = null;

function ensureTooltipExists() {
  if (!customTooltip) {
    customTooltip = document.createElement('div');
    customTooltip.style.position = 'fixed'; // Use fixed for viewport-relative positioning
    customTooltip.style.display = 'none';
    customTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'; // Semi-transparent black
    customTooltip.style.color = '#fff';
    customTooltip.style.padding = '10px 15px';
    customTooltip.style.borderRadius = '8px';
    customTooltip.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    customTooltip.style.fontSize = '14px';
    customTooltip.style.lineHeight = '1.5';
    customTooltip.style.zIndex = '2147483647'; // Max z-index to be on top
    customTooltip.style.maxWidth = '300px';
    customTooltip.style.pointerEvents = 'none'; // So the tooltip itself doesn't interfere with mouse events
    customTooltip.style.textAlign = 'left';
    customTooltip.style.wordBreak = 'break-word';
    document.body.appendChild(customTooltip);
  }
}

function showTooltip(targetElement, text) {
  ensureTooltipExists(); // Make sure the tooltip element is in the DOM
  customTooltip.innerText = text;

  // Set display to block but keep it off-screen initially to measure its dimensions
  customTooltip.style.visibility = 'hidden';
  customTooltip.style.display = 'block';

  const targetRect = targetElement.getBoundingClientRect();
  const tooltipWidth = customTooltip.offsetWidth;
  const tooltipHeight = customTooltip.offsetHeight;

  let newTop = targetRect.bottom + 8; // 8px below the target
  let newLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2); // Centered below target

  // Adjust if tooltip goes off-screen
  if (newLeft < 5) newLeft = 5; // 5px padding from left edge
  if (newLeft + tooltipWidth > window.innerWidth - 5) {
    newLeft = window.innerWidth - tooltipWidth - 5; // 5px padding from right edge
  }

  if (newTop + tooltipHeight > window.innerHeight - 5) {
    // If it goes off bottom, try to position it above the element
    newTop = targetRect.top - tooltipHeight - 8; // 8px above the target
  }
  if (newTop < 5) { // If it goes off top (either initially or after trying to move above)
    newTop = 5; // 5px padding from top edge
  }

  customTooltip.style.top = `${newTop}px`;
  customTooltip.style.left = `${newLeft}px`;
  customTooltip.style.visibility = 'visible'; // Now make it visible at the calculated position
}

function hideTooltip() {
  if (customTooltip) {
    customTooltip.style.display = 'none';
  }
}

// Helper to attach/update hover listeners
function addOrUpdateHoverTooltip(element, textOrProvider) {
    // Remove existing listeners if any, to prevent multiple tooltips or stale text
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
    
    // Store handlers on the element for potential future removal/update
    element.customMouseEnterHandler = mouseEnterHandler;
    element.customMouseLeaveHandler = hideTooltip; // hideTooltip is a consistent function

    element.addEventListener('mouseenter', element.customMouseEnterHandler);
    element.addEventListener('mouseleave', element.customMouseLeaveHandler);
}
// --- End Custom Tooltip Implementation ---

function processTweet(article) {
  ensureTooltipExists(); // Ensure tooltip div is ready for any badges on this article
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
  pendingBadge.alt = 'Evaluating tweet...'; // For accessibility
  addOrUpdateHoverTooltip(pendingBadge, 'Evaluating tweet...'); // USE CUSTOM TOOLTIP
  pendingBadge.style = 'position:absolute; top:5px; right:5px; width:16px; height:16px;';
  article.style.position = 'relative';
  article.appendChild(pendingBadge);

  // Extract tweet text
  const contentEl = article.querySelector('div[lang]');
  const tweetText = contentEl ? contentEl.innerText : '';
  if (!tweetText) return;

  // Send to server for evaluation
  chrome.runtime.sendMessage(
    { type: 'checkTweet', tweet: tweetText },
    (response) => {
      if (chrome.runtime.lastError) {
        const errorText = 'Error: Make sure the flask server is running.';
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText); // UPDATE CUSTOM TOOLTIP
        article.dataset.evalState = 'error';
        return;
      }
      if (!response) {
        const errorText = 'Error: No response from background script.';
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText); // UPDATE CUSTOM TOOLTIP
        article.dataset.evalState = 'error';
        return;
      }
      if (response.error) {
        const errorText = 'Error: ' + response.error;
        pendingBadge.src = chrome.runtime.getURL('images/381599_error_icon.png');
        pendingBadge.alt = errorText;
        addOrUpdateHoverTooltip(pendingBadge, errorText); // UPDATE CUSTOM TOOLTIP
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
        const reasonText = data.reason || 'Good to reply';
        badge.alt = reasonText;
        addOrUpdateHoverTooltip(badge, reasonText); // USE CUSTOM TOOLTIP
        badge.style = 'position:absolute; top:5px; right:5px; width:20px; height:20px; background:#fff; border-radius:50%;';
        article.appendChild(badge);
      } else {
        // Not recommended
        article.dataset.evalState = 'bad';
        article.style.border = '2px solid #ccc';
        const badge = document.createElement('img');
        badge.src = chrome.runtime.getURL('images/Red_X.svg.png');
        const reasonText = data.reason || 'Not recommended to reply';
        badge.alt = reasonText;
        addOrUpdateHoverTooltip(badge, reasonText); // USE CUSTOM TOOLTIP
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