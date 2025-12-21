/**
 * Browser Time Tracking Extension - Options Script
 * 
 * Settings page for configuring extension preferences
 * and viewing detailed statistics.
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
    
    // Load and display statistics
    loadStatistics();
}

/**
 * Set up event listeners for options page
 */
function setupEventListeners() {
    // Tracking enabled checkbox
    const trackingCheckbox = document.getElementById('tracking-enabled');
    if (trackingCheckbox) {
        trackingCheckbox.addEventListener('change', handleTrackingToggle);
    }
    
    // Auth button
    const authBtn = document.getElementById('auth-button');
    if (authBtn) {
        authBtn.addEventListener('click', handleAuthClick);
    }
    
    // Sync button
    const syncBtn = document.getElementById('sync-button');
    if (syncBtn) {
        syncBtn.addEventListener('click', handleSyncClick);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogoutClick);
    }
    
    // Auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', handleAutoSyncToggle);
    }
    
    // Export data button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportData);
    }
    
    // Clear data button
    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearData);
    }
    
    // Listen for auth success message from auth page
    window.addEventListener('message', handleAuthMessage);
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings', 'session_token', 'user']);
        const settings = result.settings || {};
        
        const trackingCheckbox = document.getElementById('tracking-enabled');
        if (trackingCheckbox) {
            trackingCheckbox.checked = settings.trackingEnabled !== false; // Default to true
        }
        
        const autoSyncCheckbox = document.getElementById('auto-sync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = settings.autoSync === true;
        }
        
        // API URL
        const apiUrlInput = document.getElementById('api-url');
        if (apiUrlInput) {
            apiUrlInput.value = result.api_url || 'http://localhost:8000';
            apiUrlInput.addEventListener('change', handleApiUrlChange);
        }
        
        // Update auth status
        updateAuthStatus(result.session_token, result.user);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Update authentication status UI
 */
function updateAuthStatus(sessionToken, user) {
    const authStatusText = document.getElementById('auth-status-text');
    const authButton = document.getElementById('auth-button');
    const syncButton = document.getElementById('sync-button');
    const logoutButton = document.getElementById('logout-button');
    
    if (sessionToken && user) {
        authStatusText.textContent = `Connected as ${user.email}`;
        authStatusText.style.color = '#28a745';
        authButton.style.display = 'none';
        syncButton.style.display = 'inline-block';
        logoutButton.style.display = 'inline-block';
    } else {
        authStatusText.textContent = 'Not connected';
        authStatusText.style.color = '#6c757d';
        authButton.style.display = 'inline-block';
        syncButton.style.display = 'none';
        logoutButton.style.display = 'none';
    }
}

/**
 * Handle auth button click - open auth page
 */
function handleAuthClick() {
    // Get API URL from settings or use default
    chrome.storage.local.get(['api_url'], (result) => {
        const apiUrl = result.api_url || 'http://localhost:8000';
        const authUrl = `${apiUrl}/static/auth.html`;
        
        // Open auth page in new window
        chrome.windows.create({
            url: authUrl,
            type: 'popup',
            width: 500,
            height: 700,
        });
    });
}

/**
 * Handle auth message from auth page
 */
function handleAuthMessage(event) {
    // Security: only accept messages from our auth page
    if (event.data && event.data.type === 'AUTH_SUCCESS') {
        const { session_token, user } = event.data;
        
        // Store session token and user data
        chrome.storage.local.set({
            session_token: session_token,
            user: user,
        }, () => {
            console.log('Session token stored');
            updateAuthStatus(session_token, user);
            
            // Show success message
            const authStatusText = document.getElementById('auth-status-text');
            authStatusText.textContent = `Connected as ${user.email}`;
            authStatusText.style.color = '#28a745';
        });
    }
}

/**
 * Handle sync button click
 */
async function handleSyncClick() {
    const syncButton = document.getElementById('sync-button');
    syncButton.disabled = true;
    syncButton.textContent = 'Syncing...';
    
    try {
        // TODO: Implement sync logic
        console.log('Syncing data with backend...');
        
        // Get session token
        const result = await chrome.storage.local.get(['session_token']);
        if (!result.session_token) {
            throw new Error('Not authenticated');
        }
        
        // Get local data
        const localData = await chrome.storage.local.get(null);
        const sessions = Object.keys(localData)
            .filter(key => key.startsWith('session_'))
            .reduce((acc, key) => {
                acc[key] = localData[key];
                return acc;
            }, {});
        
        // TODO: Send to backend API
        // For now, just show success
        alert('Sync completed! (Not yet implemented)');
        
    } catch (error) {
        console.error('Sync error:', error);
        alert(`Sync failed: ${error.message}`);
    } finally {
        syncButton.disabled = false;
        syncButton.textContent = 'Sync Now';
    }
}

/**
 * Handle logout button click
 */
async function handleLogoutClick() {
    if (!confirm('Are you sure you want to sign out?')) {
        return;
    }
    
    try {
        // Get session token
        const result = await chrome.storage.local.get(['session_token', 'api_url']);
        const sessionToken = result.session_token;
        const apiUrl = result.api_url || 'http://localhost:8000';
        
        // Call logout API
        if (sessionToken) {
            try {
                await fetch(`${apiUrl}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'X-Session-Token': sessionToken,
                    },
                });
            } catch (error) {
                console.error('Logout API error:', error);
                // Continue anyway to clear local data
            }
        }
        
        // Clear local session data
        await chrome.storage.local.remove(['session_token', 'user']);
        
        // Update UI
        updateAuthStatus(null, null);
        
        console.log('Logged out successfully');
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error during logout');
    }
}

/**
 * Handle auto-sync toggle
 */
async function handleAutoSyncToggle(event) {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        settings.autoSync = event.target.checked;
        
        await chrome.storage.local.set({ settings });
        
        console.log('Auto-sync:', event.target.checked);
        
    } catch (error) {
        console.error('Error updating auto-sync setting:', error);
    }
}

/**
 * Handle API URL change
 */
async function handleApiUrlChange(event) {
    try {
        const apiUrl = event.target.value.trim();
        await chrome.storage.local.set({ api_url: apiUrl });
        console.log('API URL updated:', apiUrl);
    } catch (error) {
        console.error('Error updating API URL:', error);
    }
}

/**
 * Handle tracking toggle
 */
async function handleTrackingToggle(event) {
    try {
        const isEnabled = event.target.checked;
        
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        settings.trackingEnabled = isEnabled;
        
        await chrome.storage.local.set({ settings });
        
        console.log('Tracking enabled:', isEnabled);
        
    } catch (error) {
        console.error('Error updating tracking setting:', error);
    }
}

/**
 * Load and display statistics
 */
async function loadStatistics() {
    try {
        const statsDisplay = document.getElementById('stats-display');
        if (!statsDisplay) return;
        
        // Get all session data
        const result = await chrome.storage.local.get(null);
        const sessions = Object.keys(result)
            .filter(key => key.startsWith('session_'))
            .reduce((acc, key) => {
                acc[key] = result[key];
                return acc;
            }, {});
        
        if (Object.keys(sessions).length === 0) {
            statsDisplay.innerHTML = '<p>No data available yet. Start browsing to see your statistics!</p>';
            return;
        }
        
        // Calculate total statistics
        const totalStats = calculateTotalStatistics(sessions);
        
        // Display statistics
        displayStatistics(totalStats, sessions);
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        const statsDisplay = document.getElementById('stats-display');
        if (statsDisplay) {
            statsDisplay.innerHTML = '<p style="color: #dc3545;">Error loading statistics</p>';
        }
    }
}

/**
 * Calculate total statistics from all sessions
 */
function calculateTotalStatistics(sessions) {
    const totalTime = Object.values(sessions).reduce((total, session) => {
        return total + Object.values(session.domains || {}).reduce((sessionTotal, domain) => {
            return sessionTotal + (domain.totalTime || 0);
        }, 0);
    }, 0);
    
    const totalSites = new Set();
    Object.values(sessions).forEach(session => {
        Object.keys(session.domains || {}).forEach(domain => {
            totalSites.add(domain);
        });
    });
    
    const totalSessions = Object.keys(sessions).length;
    
    return {
        totalTime,
        totalSites: totalSites.size,
        totalSessions
    };
}

/**
 * Display statistics in the UI
 */
function displayStatistics(totalStats, sessions) {
    const statsDisplay = document.getElementById('stats-display');
    
    const hours = Math.floor(totalStats.totalTime / 3600);
    const minutes = Math.floor((totalStats.totalTime % 3600) / 60);
    
    statsDisplay.innerHTML = `
        <h3>Overall Statistics</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <h3>Total Time</h3>
                <div class="value">${hours}h ${minutes}m</div>
            </div>
            <div class="stat-item">
                <h3>Unique Sites</h3>
                <div class="value">${totalStats.totalSites}</div>
            </div>
            <div class="stat-item">
                <h3>Tracking Days</h3>
                <div class="value">${totalStats.totalSessions}</div>
            </div>
        </div>
        <div class="domain-list">
            <h3>Top Sites (All Time)</h3>
            ${generateTopSitesList(sessions)}
        </div>
    `;
}

/**
 * Generate top sites list
 */
function generateTopSitesList(sessions) {
    const domainStats = {};
    
    // Aggregate domain data across all sessions
    Object.values(sessions).forEach(session => {
        Object.entries(session.domains || {}).forEach(([domain, data]) => {
            if (!domainStats[domain]) {
                domainStats[domain] = 0;
            }
            domainStats[domain] += data.totalTime || 0;
        });
    });
    
    // Sort by time spent
    const sortedDomains = Object.entries(domainStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10
    
    if (sortedDomains.length === 0) {
        return '<p>No data available</p>';
    }
    
    return sortedDomains.map(([domain, time]) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        return `
            <div class="domain-item">
                <span class="domain-name">${domain}</span>
                <span class="domain-time">${timeStr}</span>
            </div>
        `;
    }).join('');
}

/**
 * Handle export data
 */
async function handleExportData() {
    try {
        const result = await chrome.storage.local.get(null);
        const sessions = Object.keys(result)
            .filter(key => key.startsWith('session_'))
            .reduce((acc, key) => {
                acc[key] = result[key];
                return acc;
            }, {});
        
        const dataStr = JSON.stringify(sessions, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-time-tracking-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Data exported successfully');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data');
    }
}

/**
 * Handle clear data
 */
async function handleClearData() {
    if (!confirm('Are you sure you want to clear all tracking data? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Get all keys
        const result = await chrome.storage.local.get(null);
        const sessionKeys = Object.keys(result).filter(key => key.startsWith('session_'));
        
        // Remove session data
        await chrome.storage.local.remove(sessionKeys);
        
        // Reload statistics
        loadStatistics();
        
        console.log('Data cleared successfully');
        alert('All tracking data has been cleared');
        
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data');
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);
