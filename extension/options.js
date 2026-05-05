// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  const backendUrlInput = document.getElementById('backendUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const testConnectionBtn = document.getElementById('testConnection');
  const messageEl = document.getElementById('message');
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');

  // Load saved settings
  loadSettings();

  // Save settings
  saveBtn.addEventListener('click', saveSettings);

  // Reset to defaults
  resetBtn.addEventListener('click', resetSettings);

  // Test connection
  testConnectionBtn.addEventListener('click', testConnection);

  async function loadSettings() {
    const { backendUrl, apiKey } = await chrome.storage.sync.get(['backendUrl', 'apiKey']);
    
    if (backendUrl) {
      backendUrlInput.value = backendUrl;
    }
    
    if (apiKey) {
      apiKeyInput.value = apiKey;
    }

    // Test connection on load
    testConnection();
  }

  async function saveSettings() {
    const backendUrl = backendUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!backendUrl) {
      showMessage('Backend URL is required', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        backendUrl,
        apiKey
      });

      showMessage('Settings saved successfully!', 'success');
      
      // Test connection after saving
      setTimeout(testConnection, 500);
    } catch (error) {
      showMessage(`Failed to save settings: ${error.message}`, 'error');
    }
  }

  function resetSettings() {
    backendUrlInput.value = 'http://localhost:3000';
    apiKeyInput.value = '';
    showMessage('Settings reset to defaults', 'success');
  }

  async function testConnection() {
    const backendUrl = backendUrlInput.value.trim();

    if (!backendUrl) {
      updateStatus('disconnected', 'Backend URL not configured');
      return;
    }

    updateStatus('checking', 'Testing connection...');

    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        updateStatus('connected', `Connected to backend (uptime: ${Math.floor(data.uptime)}s)`);
      } else {
        updateStatus('disconnected', 'Backend not responding');
      }
    } catch (error) {
      updateStatus('disconnected', `Cannot reach backend: ${error.message}`);
    }
  }

  function updateStatus(status, text) {
    statusText.textContent = text;
    statusIndicator.className = `status-indicator ${status}`;
  }

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;

    setTimeout(() => {
      messageEl.classList.remove('show');
    }, 3000);
  }
});
