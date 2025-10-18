/**
 * Browser Time Tracking Extension - Options Page Script
 * 
 * Handles settings management, data export/import, and configuration options.
 */

/**
 * Initialize options page
 */
function initializeOptions() {
    console.log('Initializing Browser Time Tracking options page...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load current settings
    loadSettings();
}

/**
 * Set up event listeners for options page
 */
function setupEventListeners() {
    // Save settings button
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Reset settings button
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Export buttons
    const exportCsvBtn = document.getElementById('export-data');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportData('csv'));
    }
    
    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => exportData('json'));
    }
    
    // Clear data button
    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllData);
    }
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        
        // Load tracking settings
        const trackingEnabled = document.getElementById('tracking-enabled');
        if (trackingEnabled) {
            trackingEnabled.checked = settings.trackingEnabled !== false;
        }
        
        const trackIncognito = document.getElementById('track-incognito');
        if (trackIncognito) {
            trackIncognito.checked = settings.privacy?.trackIncognito || false;
        }
        
        // Load data retention
        const dataRetention = document.getElementById('data-retention');
        if (dataRetention) {
            dataRetention.value = settings.dataRetentionDays || 90;
        }
        
        // Load categories
        loadCategories(settings.categories || {});
        
        console.log('Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Failed to load settings', 'error');
    }
}

/**
 * Load category settings
 * @param {Object} categories - Category settings
 */
function loadCategories(categories) {
    const categoryFields = {
        work: 'work-domains',
        entertainment: 'entertainment-domains',
        social: 'social-domains',
        news: 'news-domains'
    };
    
    Object.entries(categoryFields).forEach(([category, fieldId]) => {
        const field = document.getElementById(fieldId);
        if (field && categories[category]) {
            field.value = categories[category].join(', ');
        }
    });
}

/**
 * Save settings to storage
 */
async function saveSettings() {
    try {
        // Collect form data
        const settings = {
            trackingEnabled: document.getElementById('tracking-enabled')?.checked !== false,
            dataRetentionDays: parseInt(document.getElementById('data-retention')?.value) || 90,
            privacy: {
                trackIncognito: document.getElementById('track-incognito')?.checked || false,
                trackPrivateBrowsing: document.getElementById('track-incognito')?.checked || false
            },
            categories: getCategoriesFromForm()
        };
        
        // Save to storage
        await chrome.storage.local.set({ settings });
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'SETTINGS_UPDATED',
            settings
        });
        
        showMessage('Settings saved successfully', 'success');
        console.log('Settings saved:', settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Failed to save settings', 'error');
    }
}

/**
 * Get categories from form inputs
 * @returns {Object} Categories object
 */
function getCategoriesFromForm() {
    const categoryFields = {
        work: 'work-domains',
        entertainment: 'entertainment-domains',
        social: 'social-domains',
        news: 'news-domains'
    };
    
    const categories = {};
    
    Object.entries(categoryFields).forEach(([category, fieldId]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            const domains = field.value
                .split(',')
                .map(domain => domain.trim())
                .filter(domain => domain.length > 0);
            categories[category] = domains;
        }
    });
    
    return categories;
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }
    
    try {
        const defaultSettings = {
            trackingEnabled: true,
            dataRetentionDays: 90,
            privacy: {
                trackIncognito: false,
                trackPrivateBrowsing: false
            },
            categories: {
                work: [],
                entertainment: [],
                social: [],
                news: []
            }
        };
        
        await chrome.storage.local.set({ settings: defaultSettings });
        
        // Reload the page to reflect changes
        location.reload();
    } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('Failed to reset settings', 'error');
    }
}

/**
 * Export data in specified format
 * @param {string} format - Export format ('csv' or 'json')
 */
async function exportData(format) {
    try {
        // Get all session data
        const allData = await chrome.storage.local.get();
        const sessionKeys = Object.keys(allData).filter(key => key.startsWith('session_'));
        
        if (sessionKeys.length === 0) {
            showMessage('No data to export', 'warning');
            return;
        }
        
        const exportData = {};
        sessionKeys.forEach(key => {
            exportData[key] = allData[key];
        });
        
        if (format === 'csv') {
            exportToCsv(exportData);
        } else if (format === 'json') {
            exportToJson(exportData);
        }
        
        showMessage(`Data exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showMessage('Failed to export data', 'error');
    }
}

/**
 * Export data as CSV
 * @param {Object} data - Data to export
 */
function exportToCsv(data) {
    const csvRows = ['Date,Domain,Total Time (seconds),Pages'];
    
    Object.entries(data).forEach(([sessionKey, sessionData]) => {
        const date = sessionKey.replace('session_', '');
        
        Object.entries(sessionData.domains || {}).forEach(([domain, domainData]) => {
            csvRows.push(`${date},${domain},${domainData.totalTime || 0},"${Object.keys(domainData.pages || {}).join(';')}"`);
        });
    });
    
    const csvContent = csvRows.join('\n');
    downloadFile(csvContent, 'browser-time-tracking.csv', 'text/csv');
}

/**
 * Export data as JSON
 * @param {Object} data - Data to export
 */
function exportToJson(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, 'browser-time-tracking.json', 'application/json');
}

/**
 * Download file with specified content
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Clear all tracking data
 */
async function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL tracking data? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Get all session keys
        const allData = await chrome.storage.local.get();
        const sessionKeys = Object.keys(allData).filter(key => key.startsWith('session_'));
        
        // Remove all session data
        await chrome.storage.local.remove(sessionKeys);
        
        showMessage('All tracking data cleared', 'success');
        console.log('All tracking data cleared');
    } catch (error) {
        console.error('Error clearing data:', error);
        showMessage('Failed to clear data', 'error');
    }
}

/**
 * Show message to user
 * @param {string} message - Message text
 * @param {string} type - Message type ('success', 'error', 'warning')
 */
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(messageEl);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);
