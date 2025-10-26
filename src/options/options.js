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
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        
        const trackingCheckbox = document.getElementById('tracking-enabled');
        if (trackingCheckbox) {
            trackingCheckbox.checked = settings.trackingEnabled !== false; // Default to true
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
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