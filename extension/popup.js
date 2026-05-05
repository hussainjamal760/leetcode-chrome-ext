// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const settingsBtn = document.getElementById('settingsBtn');

  // Check backend connection
  checkConnection();

  // Open settings page
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  async function checkConnection() {
    try {
      const { backendUrl } = await chrome.storage.sync.get(['backendUrl']);
      
      if (!backendUrl) {
        statusEl.textContent = 'Backend URL not configured';
        statusEl.className = 'status disconnected';
        return;
      }

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        statusEl.textContent = '✓ Connected to backend';
        statusEl.className = 'status connected';
      } else {
        statusEl.textContent = '✗ Backend not responding';
        statusEl.className = 'status disconnected';
      }
    } catch (error) {
      statusEl.textContent = '✗ Cannot reach backend';
      statusEl.className = 'status disconnected';
    }
  }
});
