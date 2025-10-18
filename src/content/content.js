/**
 * Browser Time Tracking Extension - Content Script
 * 
 * Injected into web pages to collect metadata and handle SPA navigation.
 * Runs in the context of web pages to gather additional information.
 */

/**
 * Initialize content script
 */
function initializeContentScript() {
    console.log('Browser Time Tracking content script loaded');
    
    // Set up event listeners
    setupEventListeners();
    
    // Collect initial page metadata
    collectPageMetadata();
}

/**
 * Set up event listeners for page changes
 */
function setupEventListeners() {
    // Handle SPA navigation (URL changes without page reload)
    let lastUrl = location.href;
    
    // Monitor URL changes
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            handleUrlChange(currentUrl);
        }
    }).observe(document, { subtree: true, childList: true });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page unload
    window.addEventListener('beforeunload', handlePageUnload);
}

/**
 * Handle URL changes in SPA applications
 * @param {string} newUrl - New URL
 */
function handleUrlChange(newUrl) {
    console.log('URL changed to:', newUrl);
    
    // Send message to background script about URL change
    chrome.runtime.sendMessage({
        type: 'URL_CHANGED',
        url: newUrl,
        timestamp: Date.now()
    }).catch(error => {
        console.error('Error sending URL change message:', error);
    });
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
    const isVisible = !document.hidden;
    
    chrome.runtime.sendMessage({
        type: 'VISIBILITY_CHANGED',
        isVisible,
        timestamp: Date.now()
    }).catch(error => {
        console.error('Error sending visibility change message:', error);
    });
}

/**
 * Handle page unload
 */
function handlePageUnload() {
    chrome.runtime.sendMessage({
        type: 'PAGE_UNLOAD',
        timestamp: Date.now()
    }).catch(error => {
        console.error('Error sending page unload message:', error);
    });
}

/**
 * Collect metadata about the current page
 */
function collectPageMetadata() {
    const metadata = {
        title: document.title,
        url: location.href,
        domain: location.hostname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
    };
    
    // Try to determine page type/category
    metadata.category = determinePageCategory(metadata);
    
    // Send metadata to background script
    chrome.runtime.sendMessage({
        type: 'PAGE_METADATA',
        metadata
    }).catch(error => {
        console.error('Error sending page metadata:', error);
    });
}

/**
 * Determine page category based on URL and content
 * @param {Object} metadata - Page metadata
 * @returns {string} Page category
 */
function determinePageCategory(metadata) {
    const url = metadata.url.toLowerCase();
    const title = metadata.title.toLowerCase();
    
    // Work-related sites
    if (url.includes('github.com') || url.includes('stackoverflow.com') || 
        url.includes('linkedin.com') || url.includes('slack.com') ||
        title.includes('work') || title.includes('project')) {
        return 'work';
    }
    
    // Entertainment sites
    if (url.includes('youtube.com') || url.includes('netflix.com') || 
        url.includes('twitch.tv') || url.includes('spotify.com') ||
        title.includes('video') || title.includes('music')) {
        return 'entertainment';
    }
    
    // Social media
    if (url.includes('facebook.com') || url.includes('twitter.com') || 
        url.includes('instagram.com') || url.includes('tiktok.com') ||
        title.includes('social')) {
        return 'social';
    }
    
    // News and information
    if (url.includes('news') || url.includes('cnn.com') || 
        url.includes('bbc.com') || url.includes('reddit.com') ||
        title.includes('news') || title.includes('article')) {
        return 'news';
    }
    
    // Shopping
    if (url.includes('amazon.com') || url.includes('shop') || 
        url.includes('buy') || title.includes('shop')) {
        return 'shopping';
    }
    
    return 'other';
}

/**
 * Get page performance metrics
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
    if (!window.performance || !window.performance.timing) {
        return null;
    }
    
    const timing = window.performance.timing;
    const navigation = window.performance.navigation;
    
    return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: timing.responseEnd - timing.navigationStart,
        navigationType: navigation.type
    };
}

/**
 * Monitor page performance and send metrics
 */
function monitorPerformance() {
    // Wait for page to load
    if (document.readyState === 'complete') {
        const metrics = getPerformanceMetrics();
        if (metrics) {
            chrome.runtime.sendMessage({
                type: 'PERFORMANCE_METRICS',
                metrics,
                timestamp: Date.now()
            }).catch(error => {
                console.error('Error sending performance metrics:', error);
            });
        }
    } else {
        // Wait for page to complete loading
        window.addEventListener('load', () => {
            setTimeout(() => {
                const metrics = getPerformanceMetrics();
                if (metrics) {
                    chrome.runtime.sendMessage({
                        type: 'PERFORMANCE_METRICS',
                        metrics,
                        timestamp: Date.now()
                    }).catch(error => {
                        console.error('Error sending performance metrics:', error);
                    });
                }
            }, 1000); // Wait 1 second after load
        });
    }
}

// Initialize content script
initializeContentScript();

// Monitor performance
monitorPerformance();
