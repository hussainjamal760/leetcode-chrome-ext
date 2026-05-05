// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode Auto Sync extension installed');
  
  // Set default values
  chrome.storage.sync.get(['backendUrl'], (result) => {
    if (!result.backendUrl) {
      chrome.storage.sync.set({
        backendUrl: 'http://localhost:3000'
      });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sync') {
    handleSync(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle sync request
async function handleSync(data) {
  const { backendUrl, apiKey } = await chrome.storage.sync.get(['backendUrl', 'apiKey']);
  
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  const response = await fetch(`${backendUrl}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      userApiKey: apiKey || ''
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sync failed');
  }

  return await response.json();
}
