/**
 * Browser Time Tracking Extension - Popup Script
 * 
 * Main popup interface for displaying time tracking statistics
 * and providing quick access to features.
 */

/**
 * Initialize popup interface
 */
function initializePopup() {
    console.log('Initializing Browser Time Tracking popup...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display current statistics
    loadCurrentStats();
    
    // Update status indicator
    updateStatusIndicator();
}

/**
 * Set up event listeners for popup interactions
 */
function setupEventListeners() {
    // View details button
    const viewDetailsBtn = document.getElementById('view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
            window.close();
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('open-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
            window.close();
        });
    }
}

/**
 * Load current statistics from storage
 */
async function loadCurrentStats() {
    try {
        // Get today's date for data retrieval
        const today = new Date().toISOString().split('T')[0];
        console.log('Loading stats for date:', today);
        
        // Get stored data
        const result = await chrome.storage.local.get([`session_${today}`]);
        console.log('Storage result:', result);
        
        const todaySession = result[`session_${today}`] || { domains: {} };
        console.log('Today session data:', todaySession);
        
        // Calculate today's total time
        const totalTime = calculateTotalTime(todaySession.domains);
        const activeSites = Object.keys(todaySession.domains).length;
        
        console.log('Calculated total time:', totalTime, 'seconds');
        console.log('Active sites:', activeSites);
        
        // Update UI
        updateTodayTime(totalTime);
        updateActiveSites(activeSites);
        updateQuickStats(todaySession.domains);
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showErrorMessage('Failed to load statistics');
    }
}

/**
 * Calculate total time from domains data
 * @param {Object} domains - Domains data object
 * @returns {number} Total time in seconds
 */
function calculateTotalTime(domains) {
    return Object.values(domains).reduce((total, domain) => {
        return total + (domain.totalTime || 0);
    }, 0);
}

/**
 * Update today's time display
 * @param {number} totalSeconds - Total time in seconds
 */
function updateTodayTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const timeElement = document.getElementById('today-time');
    if (timeElement) {
        timeElement.textContent = `${hours}h ${minutes}m`;
    }
}

/**
 * Update active sites count
 * @param {number} count - Number of active sites
 */
function updateActiveSites(count) {
    const sitesElement = document.getElementById('active-sites');
    if (sitesElement) {
        sitesElement.textContent = count.toString();
    }
}

/**
 * Update quick stats section
 * @param {Object} domains - Domains data
 */
function updateQuickStats(domains) {
    const quickStatsElement = document.getElementById('quick-stats');
    if (!quickStatsElement) return;
    
    const domainEntries = Object.entries(domains);
    
    if (domainEntries.length === 0) {
        quickStatsElement.innerHTML = '<p>No data yet. Start browsing to see your time tracking!</p>';
        return;
    }
    
    // Sort domains by time spent
    const sortedDomains = domainEntries
        .sort(([,a], [,b]) => (b.totalTime || 0) - (a.totalTime || 0))
        .slice(0, 3); // Top 3 domains
    
    const statsHTML = sortedDomains.map(([domain, data]) => {
        const time = formatTime(data.totalTime || 0);
        return `<div class="domain-stat">
            <span class="domain-name">${domain}</span>
            <span class="domain-time">${time}</span>
        </div>`;
    }).join('');
    
    quickStatsElement.innerHTML = `
        <h4>Top Sites Today</h4>
        <div class="domain-stats">${statsHTML}</div>
    `;
}

/**
 * Format time in seconds to readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Update status indicator based on tracking state
 */
async function updateStatusIndicator() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        const isTracking = settings.trackingEnabled !== false; // Default to true
        
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (isTracking) {
                statusDot.classList.add('active');
                statusText.textContent = 'Tracking';
            } else {
                statusDot.classList.remove('active');
                statusText.textContent = 'Paused';
            }
        }
    } catch (error) {
        console.error('Error updating status indicator:', error);
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const quickStatsElement = document.getElementById('quick-stats');
    if (quickStatsElement) {
        quickStatsElement.innerHTML = `<p style="color: #e74c3c;">${message}</p>`;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);
