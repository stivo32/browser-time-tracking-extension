/**
 * Test setup for Browser Time Tracking Extension
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
    runtime: {
        getManifest: () => ({ version: '1.0.0' }),
        getURL: (path) => `chrome-extension://test-id/${path}`,
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn()
        }
    },
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn()
        }
    },
    tabs: {
        query: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        onActivated: {
            addListener: vi.fn()
        },
        onUpdated: {
            addListener: vi.fn()
        }
    },
    windows: {
        WINDOW_ID_NONE: -1,
        onFocusChanged: {
            addListener: vi.fn()
        }
    },
    alarms: {
        create: vi.fn(),
        onAlarm: {
            addListener: vi.fn()
        }
    }
};

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};
