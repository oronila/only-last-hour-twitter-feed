document.addEventListener('DOMContentLoaded', () => {
  const filterHoursInput = document.getElementById('filterHours');
  const oldTweetActionSelect = document.getElementById('oldTweetAction');
  const badTweetActionSelect = document.getElementById('badTweetAction');
  const customPromptTextarea = document.getElementById('customPrompt');
  const saveButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');

  const DEFAULT_CUSTOM_PROMPT = "Given the following tweet, determine if it's a strategic one for me to reply to for audience growth. {tweet}";

  // Load saved settings
  chrome.storage.sync.get([
    'filterHours', 
    'oldTweetAction',
    'badTweetAction',
    'customPrompt'
  ], (data) => {
    filterHoursInput.value = data.filterHours !== undefined ? data.filterHours : 6;
    oldTweetActionSelect.value = data.oldTweetAction !== undefined ? data.oldTweetAction : 'hide';
    badTweetActionSelect.value = data.badTweetAction !== undefined ? data.badTweetAction : 'mark';
    customPromptTextarea.value = data.customPrompt !== undefined ? data.customPrompt : DEFAULT_CUSTOM_PROMPT;
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const hours = parseInt(filterHoursInput.value, 10);
    const oldAction = oldTweetActionSelect.value;
    const badAction = badTweetActionSelect.value;
    const customPromptValue = customPromptTextarea.value.trim();

    if (isNaN(hours) || hours < 0) {
      statusMessage.textContent = 'Please enter a valid non-negative number for hours.';
      statusMessage.style.color = 'red';
      return;
    }

    if (!customPromptValue.includes('{tweet}')) {
      statusMessage.textContent = 'Custom prompt must include {tweet} placeholder.';
      statusMessage.style.color = 'red';
      return;
    }

    chrome.storage.sync.set({
      filterHours: hours,
      oldTweetAction: oldAction,
      badTweetAction: badAction,
      customPrompt: customPromptValue
    }, () => {
      statusMessage.textContent = 'Settings saved!';
      statusMessage.style.color = 'green';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 2000);
    });
  });
}); 