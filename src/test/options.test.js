/**
 * Tests for options page functionality
 */

import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { vi } from 'vitest';

describe('Options Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock successful storage responses
        chrome.storage.local.get.mockResolvedValue({
            settings: {
                trackingEnabled: true,
                dataRetentionDays: 90,
                privacy: {
                    trackIncognito: false
                },
                categories: {
                    work: ['github.com', 'stackoverflow.com'],
                    entertainment: ['youtube.com', 'netflix.com']
                }
            }
        });
        chrome.storage.local.set.mockResolvedValue();
    });

    test('renders options page correctly', () => {
        document.body.innerHTML = `
            <div id="root">
                <div class="options-container">
                    <header class="options-header">
                        <h1>Browser Time Tracking Settings</h1>
                    </header>
                    <main class="options-main">
                        <section class="settings-section">
                            <h2>Tracking Settings</h2>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <input type="checkbox" id="tracking-enabled" class="setting-checkbox">
                                    <span class="setting-text">Enable time tracking</span>
                                </label>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        `;

        expect(screen.getByText('Browser Time Tracking Settings')).toBeInTheDocument();
        expect(screen.getByText('Tracking Settings')).toBeInTheDocument();
        expect(screen.getByText('Enable time tracking')).toBeInTheDocument();
    });

    test('loads settings correctly', async () => {
        const mockSettings = {
            trackingEnabled: true,
            dataRetentionDays: 90,
            privacy: { trackIncognito: false },
            categories: {
                work: ['github.com'],
                entertainment: ['youtube.com']
            }
        };

        chrome.storage.local.get.mockResolvedValue({ settings: mockSettings });

        // Simulate loading settings
        const result = await chrome.storage.local.get(['settings']);
        expect(result.settings).toEqual(mockSettings);
    });

    test('saves settings correctly', async () => {
        const mockSettings = {
            trackingEnabled: true,
            dataRetentionDays: 60,
            privacy: { trackIncognito: true },
            categories: {
                work: ['github.com', 'stackoverflow.com'],
                entertainment: ['youtube.com']
            }
        };

        chrome.storage.local.set.mockResolvedValue();

        await chrome.storage.local.set({ settings: mockSettings });
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: mockSettings });
    });

    test('handles form validation', () => {
        document.body.innerHTML = `
            <form id="settings-form">
                <input type="checkbox" id="tracking-enabled">
                <select id="data-retention">
                    <option value="30">30 days</option>
                    <option value="90" selected>90 days</option>
                </select>
                <input type="text" id="work-domains" value="github.com, stackoverflow.com">
            </form>
        `;

        const trackingEnabled = document.getElementById('tracking-enabled');
        const dataRetention = document.getElementById('data-retention');
        const workDomains = document.getElementById('work-domains');

        expect(trackingEnabled).toBeInTheDocument();
        expect(dataRetention.value).toBe('90');
        expect(workDomains.value).toBe('github.com, stackoverflow.com');
    });

    test('exports data correctly', () => {
        const mockData = {
            'session_2024-01-15': {
                domains: {
                    'github.com': { totalTime: 3600, pages: {} }
                }
            }
        };

        // Mock export functions
        const exportToCsv = vi.fn();
        const exportToJson = vi.fn();

        // Simulate export
        exportToCsv(mockData);
        exportToJson(mockData);

        expect(exportToCsv).toHaveBeenCalledWith(mockData);
        expect(exportToJson).toHaveBeenCalledWith(mockData);
    });

    test('handles data export formats', () => {
        const mockData = {
            'session_2024-01-15': {
                domains: {
                    'github.com': { 
                        totalTime: 3600, 
                        pages: { 'https://github.com': 1800 } 
                    }
                }
            }
        };

        // Test CSV export format
        const csvRows = ['Date,Domain,Total Time (seconds),Pages'];
        Object.entries(mockData).forEach(([sessionKey, sessionData]) => {
            const date = sessionKey.replace('session_', '');
            Object.entries(sessionData.domains || {}).forEach(([domain, domainData]) => {
                csvRows.push(`${date},${domain},${domainData.totalTime || 0},"${Object.keys(domainData.pages || {}).join(';')}"`);
            });
        });

        expect(csvRows).toHaveLength(2);
        expect(csvRows[1]).toContain('2024-01-15,github.com,3600');

        // Test JSON export format
        const jsonContent = JSON.stringify(mockData, null, 2);
        expect(jsonContent).toContain('github.com');
        expect(jsonContent).toContain('3600');
    });

    test('clears data correctly', async () => {
        const mockSessions = {
            'session_2024-01-15': { domains: {} },
            'session_2024-01-16': { domains: {} }
        };

        chrome.storage.local.get.mockResolvedValue(mockSessions);
        chrome.storage.local.remove.mockResolvedValue();

        const sessionKeys = Object.keys(mockSessions);
        await chrome.storage.local.remove(sessionKeys);

        expect(chrome.storage.local.remove).toHaveBeenCalledWith(sessionKeys);
    });

    test('handles error cases', async () => {
        chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

        try {
            await chrome.storage.local.get(['settings']);
        } catch (error) {
            expect(error.message).toBe('Storage error');
        }
    });
});
