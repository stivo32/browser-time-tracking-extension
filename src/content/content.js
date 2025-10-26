/**
 * Browser Time Tracking Extension - Content Script
 * 
 * Injected into web pages to track user activity
 * and send data to background script.
 */

/**
 * Initialize content script
 */
function initializeContentScript() {
    console.log('Browser Time Tracking content script loaded on:', window.location.href);
    
    // Set up event listeners
    setupEventListeners();
    
    // Send page load notification to background
    notifyBackgroundScript('pageLoad', {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
    });
}

/**
 * Set up event listeners for page activity
 */
function setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track page focus/blur
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('blur', handlePageBlur);
    
    // Track mouse movement (as activity indicator)
    document.addEventListener('mousemove', throttle(handleUserActivity, 5000));
    
    // Track keyboard activity
    document.addEventListener('keydown', throttle(handleUserActivity, 5000));
    
    // Track scroll activity
    window.addEventListener('scroll', throttle(handleUserActivity, 10000));
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
    const isVisible = !document.hidden;
    notifyBackgroundScript('visibilityChange', {
        visible: isVisible,
        url: window.location.href,
        timestamp: Date.now()
    });
}

/**
 * Handle page focus
 */
function handlePageFocus() {
    notifyBackgroundScript('pageFocus', {
        url: window.location.href,
        timestamp: Date.now()
    });
}

/**
 * Handle page blur
 */
function handlePageBlur() {
    notifyBackgroundScript('pageBlur', {
        url: window.location.href,
        timestamp: Date.now()
    });
}

/**
 * Handle user activity
 */
function handleUserActivity() {
    notifyBackgroundScript('userActivity', {
        url: window.location.href,
        timestamp: Date.now()
    });
}

/**
 * Throttle function to limit event frequency
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Send message to background script
 */
function notifyBackgroundScript(type, data) {
    try {
        chrome.runtime.sendMessage({
            type: type,
            data: data
        }).catch(error => {
            // Ignore errors when background script is not available
            console.debug('Background script not available:', error.message);
        });
    } catch (error) {
        console.debug('Error sending message to background:', error.message);
    }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.type) {
            case 'getPageInfo':
                sendResponse({
                    url: window.location.href,
                    title: document.title,
                    timestamp: Date.now()
                });
                break;
                
            case 'ping':
                sendResponse({ status: 'ok' });
                break;
                
            default:
                console.log('Unknown message type:', request.type);
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
    }
    
    return true; // Keep message channel open for async response
});

// Initialize content script
initializeContentScript();
