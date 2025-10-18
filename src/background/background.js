/**
 * Browser Time Tracking Extension - Background Service Worker
 * 
 * Handles time tracking logic, data storage, and extension lifecycle.
 * This is the core of the extension's functionality.
 */

/**
 * Current active tab information
 */
let currentActiveTab = null;
let trackingStartTime = null;
let isTracking = true;

/**
 * Initialize background service worker
 */
function initializeBackground() {
    console.log('Browser Time Tracking background service worker initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize default settings
    initializeSettings();
    
    // Start tracking current active tab
    startTracking();
}

/**
 * Set up Chrome extension event listeners
 */
function setupEventListeners() {
    // Track tab activation (switching between tabs)
    chrome.tabs.onActivated.addListener(handleTabActivation);
    
    // Track tab updates (URL changes, page loads)
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    
    // Track window focus changes
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChange);
    
    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener(handleExtensionInstalled);
    
    // Handle messages from popup/content scripts
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Set up periodic cleanup
    chrome.alarms.create('cleanup', { periodInMinutes: 60 });
    chrome.alarms.onAlarm.addListener(handleAlarm);
}

/**
 * Handle tab activation events
 * @param {chrome.tabs.TabActiveInfo} activeInfo - Active tab information
 */
async function handleTabActivation(activeInfo) {
    try {
        // Stop tracking previous tab
        if (currentActiveTab && trackingStartTime) {
            await recordTimeSpent(currentActiveTab, trackingStartTime);
        }
        
        // Start tracking new active tab
        currentActiveTab = activeInfo.tabId;
        trackingStartTime = Date.now();
        
        console.log(`Started tracking tab ${activeInfo.tabId}`);
    } catch (error) {
        console.error('Error handling tab activation:', error);
    }
}

/**
 * Handle tab update events (URL changes, page loads)
 * @param {number} tabId - Tab ID
 * @param {chrome.tabs.TabChangeInfo} changeInfo - Change information
 * @param {chrome.tabs.Tab} tab - Tab object
 */
async function handleTabUpdate(tabId, changeInfo, _tab) {
    try {
        // Only handle URL changes for the active tab
        if (tabId === currentActiveTab && changeInfo.url) {
            // Record time spent on previous URL
            if (trackingStartTime) {
                await recordTimeSpent(tabId, trackingStartTime);
            }
            
            // Start tracking new URL
            trackingStartTime = Date.now();
            console.log(`URL changed to: ${changeInfo.url}`);
        }
    } catch (error) {
        console.error('Error handling tab update:', error);
    }
}

/**
 * Handle window focus changes
 * @param {number} windowId - Window ID
 */
async function handleWindowFocusChange(windowId) {
    try {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            // Browser lost focus - pause tracking
            if (currentActiveTab && trackingStartTime) {
                await recordTimeSpent(currentActiveTab, trackingStartTime);
                trackingStartTime = null;
            }
        } else {
            // Browser gained focus - resume tracking
            const activeTab = await getActiveTab();
            if (activeTab) {
                currentActiveTab = activeTab.id;
                trackingStartTime = Date.now();
            }
        }
    } catch (error) {
        console.error('Error handling window focus change:', error);
    }
}

/**
 * Handle extension installation/update
 * @param {chrome.runtime.InstalledDetails} details - Installation details
 */
function handleExtensionInstalled(details) {
    console.log('Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First time installation
        initializeSettings();
    } else if (details.reason === 'update') {
        // Extension updated
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
}

/**
 * Handle messages from other parts of the extension
 * @param {any} message - Message object
 * @param {chrome.runtime.MessageSender} sender - Message sender
 * @param {Function} sendResponse - Response function
 */
function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
        case 'GET_CURRENT_STATS':
            getCurrentStats().then(sendResponse);
            return true; // Keep message channel open for async response
            
        case 'TOGGLE_TRACKING':
            toggleTracking(message.enabled).then(sendResponse);
            return true;
            
        case 'GET_SETTINGS':
            getSettings().then(sendResponse);
            return true;
            
        case 'UPDATE_SETTINGS':
            updateSettings(message.settings).then(sendResponse);
            return true;
            
        default:
            console.warn('Unknown message type:', message.type);
    }
}

/**
 * Handle periodic alarms
 * @param {chrome.alarms.Alarm} alarm - Alarm object
 */
async function handleAlarm(alarm) {
    if (alarm.name === 'cleanup') {
        await performDataCleanup();
    }
}

/**
 * Record time spent on a tab
 * @param {number} tabId - Tab ID
 * @param {number} startTime - Start time timestamp
 */
async function recordTimeSpent(tabId, startTime) {
    try {
        if (!isTracking) return;
        
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000); // Convert to seconds
        
        if (timeSpent < 1) return; // Ignore very short sessions
        
        // Get tab information
        const tab = await chrome.tabs.get(tabId);
        if (!tab || !tab.url) return;
        
        // Skip chrome:// and extension:// URLs
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }
        
        // Extract domain from URL
        const domain = extractDomain(tab.url);
        if (!domain) return;
        
        // Get current date
        const today = new Date().toISOString().split('T')[0];
        
        // Load existing session data
        const sessionKey = `session_${today}`;
        const result = await chrome.storage.local.get([sessionKey]);
        const sessionData = result[sessionKey] || { domains: {} };
        
        // Update domain data
        if (!sessionData.domains[domain]) {
            sessionData.domains[domain] = {
                totalTime: 0,
                pages: {}
            };
        }
        
        // Update total time for domain
        sessionData.domains[domain].totalTime += timeSpent;
        
        // Update page-specific time
        const pageUrl = tab.url;
        if (!sessionData.domains[domain].pages[pageUrl]) {
            sessionData.domains[domain].pages[pageUrl] = 0;
        }
        sessionData.domains[domain].pages[pageUrl] += timeSpent;
        
        // Save updated data
        await chrome.storage.local.set({ [sessionKey]: sessionData });
        
        console.log(`Recorded ${timeSpent}s on ${domain}`);
        
    } catch (error) {
        console.error('Error recording time spent:', error);
    }
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string|null} Domain name or null
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        return null;
    }
}

/**
 * Get current active tab
 * @returns {Promise<chrome.tabs.Tab|null>} Active tab or null
 */
async function getActiveTab() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        return tabs[0] || null;
    } catch (error) {
        console.error('Error getting active tab:', error);
        return null;
    }
}

/**
 * Start tracking the current active tab
 */
async function startTracking() {
    try {
        const activeTab = await getActiveTab();
        if (activeTab) {
            currentActiveTab = activeTab.id;
            trackingStartTime = Date.now();
            console.log('Started tracking active tab');
        }
    } catch (error) {
        console.error('Error starting tracking:', error);
    }
}

/**
 * Initialize default settings
 */
async function initializeSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const existingSettings = result.settings || {};
        
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
        
        // Merge with existing settings
        const settings = { ...defaultSettings, ...existingSettings };
        await chrome.storage.local.set({ settings });
        
        console.log('Settings initialized');
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

/**
 * Get current statistics
 * @returns {Promise<Object>} Current stats
 */
async function getCurrentStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await chrome.storage.local.get([`session_${today}`]);
        const sessionData = result[`session_${today}`] || { domains: {} };
        
        const totalTime = Object.values(sessionData.domains).reduce((total, domain) => {
            return total + (domain.totalTime || 0);
        }, 0);
        
        return {
            totalTime,
            activeDomains: Object.keys(sessionData.domains).length,
            domains: sessionData.domains
        };
    } catch (error) {
        console.error('Error getting current stats:', error);
        return { totalTime: 0, activeDomains: 0, domains: {} };
    }
}

/**
 * Toggle tracking on/off
 * @param {boolean} enabled - Whether tracking should be enabled
 */
async function toggleTracking(enabled) {
    try {
        isTracking = enabled;
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        settings.trackingEnabled = enabled;
        await chrome.storage.local.set({ settings });
        
        console.log(`Tracking ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Error toggling tracking:', error);
    }
}

/**
 * Get current settings
 * @returns {Promise<Object>} Current settings
 */
async function getSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        return result.settings || {};
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}

/**
 * Update settings
 * @param {Object} newSettings - New settings to save
 */
async function updateSettings(newSettings) {
    try {
        await chrome.storage.local.set({ settings: newSettings });
        console.log('Settings updated');
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

/**
 * Perform periodic data cleanup
 */
async function performDataCleanup() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        const retentionDays = settings.dataRetentionDays || 90;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        // Get all session keys
        const allData = await chrome.storage.local.get();
        const sessionKeys = Object.keys(allData).filter(key => key.startsWith('session_'));
        
        // Remove old sessions
        for (const key of sessionKeys) {
            const sessionDate = key.replace('session_', '');
            const sessionDateObj = new Date(sessionDate);
            
            if (sessionDateObj < cutoffDate) {
                await chrome.storage.local.remove(key);
                console.log(`Removed old session: ${key}`);
            }
        }
        
        console.log('Data cleanup completed');
    } catch (error) {
        console.error('Error during data cleanup:', error);
    }
}

// Initialize background service worker
initializeBackground();
