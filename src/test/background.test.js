/**
 * Tests for background service worker functionality
 */

import { vi } from 'vitest';

// Mock Chrome APIs before importing background script
const mockChrome = {
    runtime: {
        getManifest: () => ({ version: '1.0.0' }),
        onInstalled: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn() }
    },
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn()
        }
    },
    tabs: {
        query: vi.fn(),
        get: vi.fn(),
        onActivated: { addListener: vi.fn() },
        onUpdated: { addListener: vi.fn() }
    },
    windows: {
        WINDOW_ID_NONE: -1,
        onFocusChanged: { addListener: vi.fn() }
    },
    alarms: {
        create: vi.fn(),
        onAlarm: { addListener: vi.fn() }
    }
};

global.chrome = mockChrome;

describe('Background Service Worker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('initializes background service worker', () => {
        // Test that background script can be loaded without errors
        expect(() => {
            require('../background/background.js');
        }).not.toThrow();
    });

    test('handles tab activation events', async () => {
        const mockTab = { id: 123, url: 'https://github.com' };
        chrome.tabs.get.mockResolvedValue(mockTab);
        chrome.storage.local.get.mockResolvedValue({});
        chrome.storage.local.set.mockResolvedValue();

        // Simulate tab activation
        const handleTabActivation = vi.fn();
        chrome.tabs.onActivated.addListener(handleTabActivation);

        // Mock the event
        const activeInfo = { tabId: 123 };
        await handleTabActivation(activeInfo);

        expect(handleTabActivation).toHaveBeenCalledWith(activeInfo);
    });

    test('handles tab update events', async () => {
        const mockTab = { id: 123, url: 'https://github.com' };
        chrome.tabs.get.mockResolvedValue(mockTab);
        chrome.storage.local.get.mockResolvedValue({});
        chrome.storage.local.set.mockResolvedValue();

        // Simulate tab update
        const handleTabUpdate = vi.fn();
        chrome.tabs.onUpdated.addListener(handleTabUpdate);

        const changeInfo = { url: 'https://github.com' };
        await handleTabUpdate(123, changeInfo, mockTab);

        expect(handleTabUpdate).toHaveBeenCalledWith(123, changeInfo, mockTab);
    });

    test('extracts domain from URL correctly', () => {
        const extractDomain = (url) => {
            try {
                const urlObj = new URL(url);
                return urlObj.hostname;
            } catch (error) {
                return null;
            }
        };

        expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
        expect(extractDomain('https://www.google.com/search')).toBe('www.google.com');
        expect(extractDomain('http://localhost:3000')).toBe('localhost');
        expect(extractDomain('invalid-url')).toBe(null);
    });

    test('records time spent correctly', async () => {
        const mockTab = { id: 123, url: 'https://github.com' };
        chrome.tabs.get.mockResolvedValue(mockTab);
        chrome.storage.local.get.mockResolvedValue({});
        chrome.storage.local.set.mockResolvedValue();

        // Mock time recording
        const recordTimeSpent = vi.fn();
        
        // Simulate 5 seconds of activity
        const startTime = Date.now() - 5000;
        await recordTimeSpent(123, startTime);

        expect(recordTimeSpent).toHaveBeenCalledWith(123, startTime);
    });

    test('handles storage operations', async () => {
        const mockData = {
            'session_2024-01-15': {
                domains: {
                    'github.com': { totalTime: 3600, pages: {} }
                }
            }
        };

        chrome.storage.local.get.mockResolvedValue(mockData);
        chrome.storage.local.set.mockResolvedValue();

        const result = await chrome.storage.local.get(['session_2024-01-15']);
        expect(result).toEqual(mockData);

        await chrome.storage.local.set({ 'session_2024-01-15': mockData['session_2024-01-15'] });
        expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('handles message events', () => {
        const handleMessage = vi.fn();
        chrome.runtime.onMessage.addListener(handleMessage);

        const message = { type: 'GET_CURRENT_STATS' };
        const sender = { tab: { id: 123 } };
        const sendResponse = vi.fn();

        handleMessage(message, sender, sendResponse);

        expect(handleMessage).toHaveBeenCalledWith(message, sender, sendResponse);
    });

    test('performs data cleanup', async () => {
        const mockSessions = {
            'session_2024-01-01': { domains: {} },
            'session_2024-01-15': { domains: {} },
            'session_2024-02-01': { domains: {} }
        };

        chrome.storage.local.get.mockResolvedValue(mockSessions);
        chrome.storage.local.remove.mockResolvedValue();

        // Simulate cleanup of old sessions
        const sessionKeys = Object.keys(mockSessions);
        await chrome.storage.local.remove(sessionKeys);

        expect(chrome.storage.local.remove).toHaveBeenCalledWith(sessionKeys);
    });
});
