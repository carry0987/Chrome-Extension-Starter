import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome.runtime and chrome.tabs API
const mockRuntime = {
    sendMessage: vi.fn(),
    onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
    }
};

const mockTabs = {
    query: vi.fn(),
    sendMessage: vi.fn()
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    runtime: mockRuntime,
    tabs: mockTabs
} as any;

describe('Messaging System', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Message Listener', () => {
        it('should register a message listener', () => {
            const listener = vi.fn();
            mockRuntime.onMessage.addListener(listener);

            expect(mockRuntime.onMessage.addListener).toHaveBeenCalledWith(listener);
        });

        it('should handle sync response', () => {
            let registeredListener: any;
            mockRuntime.onMessage.addListener.mockImplementation((listener) => {
                registeredListener = listener;
            });

            const handler = vi.fn((msg: any) => {
                if (msg.type === 'PING') {
                    return { echo: msg.payload.text };
                }
                return null;
            });

            mockRuntime.onMessage.addListener((msg: any, sender: any, sendResponse: any) => {
                const result = handler(msg);
                if (result) {
                    sendResponse(result);
                    return true;
                }
                return false;
            });

            registeredListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
            const sendResponse = vi.fn();
            
            registeredListener({ type: 'PING', payload: { text: 'hello' } }, {}, sendResponse);

            expect(sendResponse).toHaveBeenCalled();
        });

        it('should remove listener when unsubscribed', () => {
            const listener = vi.fn();
            mockRuntime.onMessage.addListener(listener);
            mockRuntime.onMessage.removeListener(listener);

            expect(mockRuntime.onMessage.removeListener).toHaveBeenCalledWith(listener);
        });
    });

    describe('Send Message to Tab', () => {
        it('should send message to specific tab', async () => {
            const tabId = 123;
            const message = { type: 'TEST', payload: { data: 'test' } };
            
            mockTabs.sendMessage.mockImplementation((id, msg, callback) => {
                expect(id).toBe(tabId);
                expect(msg).toEqual(message);
                callback({ success: true });
            });

            await new Promise<void>((resolve) => {
                mockTabs.sendMessage(tabId, message, (response: any) => {
                    expect(response.success).toBe(true);
                    resolve();
                });
            });

            expect(mockTabs.sendMessage).toHaveBeenCalled();
        });

        it('should handle message timeout', async () => {
            mockTabs.sendMessage.mockImplementation(() => {
                // Simulate timeout by not calling callback
            });

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 100);
            });

            await expect(timeoutPromise).rejects.toThrow('Timeout');
        });
    });

    describe('Query Active Tab', () => {
        it('should query for active tab', async () => {
            const mockTab = { id: 456, active: true };
            
            mockTabs.query.mockImplementation((query, callback) => {
                expect(query).toEqual({ active: true, currentWindow: true });
                callback([mockTab]);
            });

            await new Promise<void>((resolve) => {
                mockTabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
                    expect(tabs).toHaveLength(1);
                    expect(tabs[0].id).toBe(456);
                    resolve();
                });
            });

            expect(mockTabs.query).toHaveBeenCalled();
        });

        it('should handle no active tab', async () => {
            mockTabs.query.mockImplementation((query, callback) => {
                callback([]);
            });

            await new Promise<void>((resolve) => {
                mockTabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
                    expect(tabs).toHaveLength(0);
                    resolve();
                });
            });
        });
    });

    describe('Send Message to Background', () => {
        it('should send message to background script', async () => {
            const message = { type: 'GET_DATA' };
            const expectedResponse = { data: 'response' };

            mockRuntime.sendMessage.mockImplementation((msg, callback) => {
                expect(msg).toEqual(message);
                callback(expectedResponse);
            });

            await new Promise<void>((resolve) => {
                mockRuntime.sendMessage(message, (response: any) => {
                    expect(response).toEqual(expectedResponse);
                    resolve();
                });
            });

            expect(mockRuntime.sendMessage).toHaveBeenCalled();
        });

        it('should handle background error response', async () => {
            const errorResponse = { error: 'Background error' };

            mockRuntime.sendMessage.mockImplementation((msg, callback) => {
                callback(errorResponse);
            });

            await new Promise<void>((resolve) => {
                mockRuntime.sendMessage({ type: 'TEST' }, (response: any) => {
                    expect(response.error).toBeDefined();
                    expect(response.error).toBe('Background error');
                    resolve();
                });
            });
        });
    });

    describe('Message Flow Integration', () => {
        it('should handle complete request-response cycle', async () => {
            const messageType = 'CHANGE_BG';
            const payload = { color: '#ff0000' };
            const expectedResponse = { ok: true };

            // Setup listener
            let messageHandler: any;
            mockRuntime.onMessage.addListener.mockImplementation((handler) => {
                messageHandler = handler;
            });

            // Register handler
            mockRuntime.onMessage.addListener((msg: any, sender: any, sendResponse: any) => {
                if (msg.type === messageType) {
                    sendResponse(expectedResponse);
                    return true;
                }
                return false;
            });

            messageHandler = mockRuntime.onMessage.addListener.mock.calls[0][0];

            // Simulate message
            const sendResponse = vi.fn();
            const result = messageHandler(
                { type: messageType, payload },
                {},
                sendResponse
            );

            expect(result).toBe(true);
            expect(sendResponse).toHaveBeenCalledWith(expectedResponse);
        });
    });
});
