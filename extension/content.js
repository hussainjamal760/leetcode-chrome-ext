// Content script - runs on LeetCode submission pages
(function() {
  'use strict';

  let syncButton = null;

  // Check if we're on a submission success page
  function isSubmissionSuccessPage() {
    const successIndicator = document.querySelector('[data-e2e-locator="submission-result"]');
    const acceptedText = document.querySelector('.text-green-s');
    return successIndicator && acceptedText && acceptedText.textContent.includes('Accepted');
  }

  // Extract problem data from the page
  function extractProblemData() {
    try {
      // Get problem title
      const titleElement = document.querySelector('[data-cy="question-title"]') || 
                          document.querySelector('a[href*="/problems/"]');
      const problemTitle = titleElement ? titleElement.textContent.trim() : 'Unknown Problem';

      // Get difficulty
      let difficulty = 'Medium';
      const difficultyElement = document.querySelector('[diff]') || 
                               document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard');
      if (difficultyElement) {
        const diffText = difficultyElement.textContent.toLowerCase();
        if (diffText.includes('easy')) difficulty = 'Easy';
        else if (diffText.includes('hard')) difficulty = 'Hard';
      }

      // Get code from the editor
      const codeElement = document.querySelector('.view-lines') || 
                         document.querySelector('[data-mode-id]');
      let code = '';
      if (codeElement) {
        code = codeElement.textContent || '';
      }

      // Get language
      let language = 'javascript';
      const langButton = document.querySelector('[id*="headlessui-listbox-button"]');
      if (langButton) {
        language = langButton.textContent.trim().toLowerCase();
      }

      // Get problem URL
      const problemUrl = window.location.href.split('/submissions/')[0];

      // Get tags (if available)
      const tags = [];
      const tagElements = document.querySelectorAll('[class*="topic-tag"]');
      tagElements.forEach(tag => {
        tags.push(tag.textContent.trim());
      });

      return {
        problemTitle,
        difficulty,
        code,
        language,
        problemUrl,
        tags
      };
    } catch (error) {
      console.error('Error extracting problem data:', error);
      return null;
    }
  }

  // Create and inject the sync button
  function createSyncButton() {
    if (syncButton) return;

    syncButton = document.createElement('button');
    syncButton.id = 'leetcode-sync-button';
    syncButton.className = 'sync-button';
    syncButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sync Solution
    `;
    
    syncButton.addEventListener('click', handleSyncClick);
    
    // Find a good place to inject the button
    const targetContainer = document.querySelector('[data-e2e-locator="submission-result"]') ||
                           document.querySelector('.submission-result') ||
                           document.body;
    
    targetContainer.appendChild(syncButton);
  }

  // Handle sync button click
  async function handleSyncClick() {
    try {
      // Disable button and show loading state
      syncButton.disabled = true;
      syncButton.innerHTML = `
        <span class="spinner"></span>
        Syncing...
      `;

      // Extract problem data
      const problemData = extractProblemData();
      if (!problemData || !problemData.code) {
        showNotification('Failed to extract problem data', 'error');
        resetButton();
        return;
      }

      // Get user's API key from storage
      const { apiKey, backendUrl } = await chrome.storage.sync.get(['apiKey', 'backendUrl']);
      
      if (!backendUrl) {
        showNotification('Please configure backend URL in extension settings', 'error');
        resetButton();
        return;
      }

      // Send to backend
      const response = await fetch(`${backendUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...problemData,
          userApiKey: apiKey || ''
        })
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Solution synced successfully!', 'success');
        
        // Show links
        if (result.data.githubUrl) {
          showLink('GitHub', result.data.githubUrl);
        }
        if (result.data.notionUrl) {
          showLink('Notion', result.data.notionUrl);
        }
      } else {
        showNotification(`Sync failed: ${result.error}`, 'error');
      }

      resetButton();

    } catch (error) {
      console.error('Sync error:', error);
      showNotification(`Error: ${error.message}`, 'error');
      resetButton();
    }
  }

  // Reset button to original state
  function resetButton() {
    if (syncButton) {
      syncButton.disabled = false;
      syncButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        Sync Solution
      `;
    }
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `sync-notification sync-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Show clickable link
  function showLink(label, url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.className = 'sync-link';
    link.textContent = `Open in ${label}`;
    
    if (syncButton && syncButton.parentElement) {
      syncButton.parentElement.appendChild(link);
    }
  }

  // Initialize
  function init() {
    if (isSubmissionSuccessPage()) {
      setTimeout(createSyncButton, 1000);
    }
  }

  // Watch for page changes (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      syncButton = null;
      init();
    }
  }).observe(document, { subtree: true, childList: true });

  // Initial load
  init();
})();
