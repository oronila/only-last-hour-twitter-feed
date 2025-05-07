document.addEventListener('DOMContentLoaded', () => {
  const filterHoursInput = document.getElementById('filterHours');
  const oldTweetActionSelect = document.getElementById('oldTweetAction');
  const badTweetActionSelect = document.getElementById('badTweetAction');
  const saveButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved settings
  chrome.storage.sync.get([
    'filterHours', 
    'oldTweetAction',
    'badTweetAction'
  ], (data) => {
    if (data.filterHours !== undefined) {
      filterHoursInput.value = data.filterHours;
    } else {
      filterHoursInput.value = 6;
    }
    if (data.oldTweetAction !== undefined) {
      oldTweetActionSelect.value = data.oldTweetAction;
    } else {
      oldTweetActionSelect.value = 'hide';
    }
    if (data.badTweetAction !== undefined) {
      badTweetActionSelect.value = data.badTweetAction;
    } else {
      badTweetActionSelect.value = 'mark';
    }
  });

  // Save settings
  saveButton.addEventListener('click', () => {
    const hours = parseInt(filterHoursInput.value, 10);
    const oldAction = oldTweetActionSelect.value;
    const badAction = badTweetActionSelect.value;

    if (isNaN(hours) || hours < 0) {
      statusMessage.textContent = 'Please enter a valid non-negative number for hours.';
      statusMessage.style.color = 'red';
      return;
    }

    chrome.storage.sync.set({
      filterHours: hours,
      oldTweetAction: oldAction,
      badTweetAction: badAction
    }, () => {
      statusMessage.textContent = 'Settings saved!';
      statusMessage.style.color = 'green';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 2000);
    });
  });
}); 