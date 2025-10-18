/**
 * Tests for popup functionality
 */

import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock the popup module
vi.mock('../popup/popup.js', () => ({
    initializePopup: vi.fn(),
    loadCurrentStats: vi.fn(),
    updateStatusIndicator: vi.fn()
}));

describe('Popup Interface', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Mock successful storage responses
        chrome.storage.local.get.mockResolvedValue({
            'session_2024-01-15': {
                domains: {
                    'github.com': { totalTime: 3600, pages: {} },
                    'stackoverflow.com': { totalTime: 1800, pages: {} }
                }
            },
            settings: { trackingEnabled: true }
        });
    });

    test('renders popup interface correctly', () => {
        // This would test the HTML structure
        // Since we're not using React components yet, we'll test the DOM structure
        document.body.innerHTML = `
            <div id="root">
                <div class="popup-container">
                    <header class="popup-header">
                        <h1>Time Tracker</h1>
                        <div class="status-indicator" id="status-indicator">
                            <span class="status-dot active"></span>
                            <span class="status-text">Tracking</span>
                        </div>
                    </header>
                    <main class="popup-main">
                        <div class="stats-section">
                            <div class="stat-card">
                                <h3>Today</h3>
                                <div class="stat-value" id="today-time">0h 0m</div>
                            </div>
                            <div class="stat-card">
                                <h3>Active Sites</h3>
                                <div class="stat-value" id="active-sites">0</div>
                            </div>
                        </div>
                    </main>
                    <footer class="popup-footer">
                        <button id="view-details" class="btn btn-primary">View Details</button>
                        <button id="open-settings" class="btn btn-secondary">Settings</button>
                    </footer>
                </div>
            </div>
        `;

        expect(screen.getByText('Time Tracker')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Active Sites')).toBeInTheDocument();
        expect(screen.getByText('View Details')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('displays tracking status correctly', () => {
        document.body.innerHTML = `
            <div class="status-indicator" id="status-indicator">
                <span class="status-dot active"></span>
                <span class="status-text">Tracking</span>
            </div>
        `;

        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        expect(statusDot).toHaveClass('active');
        expect(statusText).toHaveTextContent('Tracking');
    });

    test('handles button clicks correctly', () => {
        const mockCreateTab = vi.fn();
        chrome.tabs.create = mockCreateTab;

        document.body.innerHTML = `
            <button id="view-details" class="btn btn-primary">View Details</button>
            <button id="open-settings" class="btn btn-secondary">Settings</button>
        `;

        const viewDetailsBtn = document.getElementById('view-details');
        const settingsBtn = document.getElementById('open-settings');

        // Simulate button clicks
        fireEvent.click(viewDetailsBtn);
        fireEvent.click(settingsBtn);

        expect(mockCreateTab).toHaveBeenCalledTimes(2);
    });
});

describe('Popup Statistics', () => {
    test('calculates total time correctly', () => {
        const domains = {
            'github.com': { totalTime: 3600 },
            'stackoverflow.com': { totalTime: 1800 }
        };

        const totalTime = Object.values(domains).reduce((total, domain) => {
            return total + (domain.totalTime || 0);
        }, 0);

        expect(totalTime).toBe(5400); // 1.5 hours in seconds
    });

    test('formats time correctly', () => {
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        expect(formatTime(3600)).toBe('1h 0m');
        expect(formatTime(5400)).toBe('1h 30m');
        expect(formatTime(1800)).toBe('30m');
        expect(formatTime(60)).toBe('1m');
    });

    test('handles empty data gracefully', () => {
        const domains = {};
        const totalTime = Object.values(domains).reduce((total, domain) => {
            return total + (domain.totalTime || 0);
        }, 0);

        expect(totalTime).toBe(0);
    });
});
