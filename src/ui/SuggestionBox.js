const { SUGGESTION_BOX_ID } = require('../utils/constants');

class SuggestionBox {
    constructor(apiManager, configManager) {
        this.apiManager = apiManager;
        this.configManager = configManager;
        this.suggestionBox = null;
        this.isVisible = false;
        this.currentResponses = [];
        this.streamingControllers = [];
    }

    async show(textArea, action, originalText) {
        if (this.isVisible) {
            this.hide();
        }

        this.isVisible = true;
        this.currentResponses = [];
        this.streamingControllers = [];
        
        this._createSuggestionBox(textArea, originalText);
        this._startMultipleStreams(action, originalText);
    }

    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        
        // Cancel any ongoing streams
        this.streamingControllers.forEach(controller => {
            if (controller && typeof controller.abort === 'function') {
                controller.abort();
            }
        });
        this.streamingControllers = [];

        if (this.suggestionBox && this.suggestionBox.parentNode) {
            this.suggestionBox.style.opacity = '0';
            this.suggestionBox.style.transform = 'translateY(10px) scale(0.98)';
            
            setTimeout(() => {
                if (this.suggestionBox && this.suggestionBox.parentNode) {
                    this.suggestionBox.parentNode.removeChild(this.suggestionBox);
                    this.suggestionBox = null;
                }
                this._removeStyles();
            }, 200);
        }
    }

    _createSuggestionBox(textArea, originalText) {
        this._injectStyles();
        
        this.suggestionBox = document.createElement('div');
        this.suggestionBox.id = SUGGESTION_BOX_ID;
        this.suggestionBox.className = 'verba-suggestion-box';
        
        // Match the exact width and position of the text area
        const textAreaRect = textArea.getBoundingClientRect();
        const boxHeight = Math.min(450, window.innerHeight * 0.6);
        
        this.suggestionBox.style.cssText = `
            position: fixed;
            bottom: ${window.innerHeight - textAreaRect.top + 12}px;
            left: ${textAreaRect.left}px;
            width: ${textAreaRect.width}px;
            max-height: ${boxHeight}px;
            z-index: 10002;
            opacity: 0;
            transform: translateY(10px) scale(0.98);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        this.suggestionBox.innerHTML = `
            <div class="suggestion-header">
                <div class="header-content">
                    <div class="header-title">
                        <span class="magic-icon">✨</span>
                        <span class="title-text">AI Suggestions</span>
                    </div>
                    <div class="header-subtitle">Click any suggestion to copy</div>
                </div>
                <div class="header-actions">
                    <button class="action-btn refresh-btn" title="Generate new suggestions">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                        </svg>
                    </button>
                    <button class="action-btn close-btn" title="Close suggestions">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="suggestions-container">
                ${this._createSuggestionSlots()}
            </div>
        `;

        document.body.appendChild(this.suggestionBox);

        // Setup event listeners
        this.suggestionBox.querySelector('.close-btn').addEventListener('click', () => this.hide());
        this.suggestionBox.querySelector('.refresh-btn').addEventListener('click', () => {
            this._startMultipleStreams(this.currentAction, this.currentOriginalText);
        });

        // Animate in
        requestAnimationFrame(() => {
            this.suggestionBox.style.opacity = '1';
            this.suggestionBox.style.transform = 'translateY(0) scale(1)';
        });

        // Close on outside click
        document.addEventListener('click', this._handleOutsideClick.bind(this));
    }

    _createSuggestionSlots() {
        const numSuggestions = 3;
        let html = '';
        
        for (let i = 0; i < numSuggestions; i++) {
            html += `
                <div class="suggestion-slot" data-index="${i}">
                    <div class="suggestion-content">
                        <div class="suggestion-text-container">
                            <div class="suggestion-text" data-placeholder="Generating suggestion ${i + 1}..."></div>
                            <div class="suggestion-overlay">
                                <div class="copy-feedback">Copied to clipboard!</div>
                            </div>
                        </div>
                        <div class="suggestion-actions">
                            <div class="suggestion-status">
                                <div class="status-indicator">
                                    <div class="loading-spinner"></div>
                                </div>
                            </div>
                            <button class="copy-btn" title="Copy to clipboard" style="opacity: 0; pointer-events: none;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    async _startMultipleStreams(action, originalText) {
        this.currentAction = action;
        this.currentOriginalText = originalText;
        
        // Reset all slots
        const slots = this.suggestionBox.querySelectorAll('.suggestion-slot');
        slots.forEach((slot, index) => {
            const textElement = slot.querySelector('.suggestion-text');
            const statusIndicator = slot.querySelector('.status-indicator');
            const copyBtn = slot.querySelector('.copy-btn');
            
            textElement.textContent = '';
            textElement.setAttribute('data-placeholder', `Generating suggestion ${index + 1}...`);
            statusIndicator.innerHTML = '<div class="loading-spinner"></div>';
            copyBtn.style.opacity = '0';
            copyBtn.style.pointerEvents = 'none';
            slot.classList.remove('completed', 'error');
        });

        // Start multiple streams with slight variations
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(this._startSingleStream(action, originalText, i));
            // Stagger the requests slightly
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error in suggestion streams:', error);
        }
    }

    async _startSingleStream(action, originalText, slotIndex) {
        const slot = this.suggestionBox.querySelector(`.suggestion-slot[data-index="${slotIndex}"]`);
        const textElement = slot.querySelector('.suggestion-text');
        const statusIndicator = slot.querySelector('.status-indicator');
        const copyBtn = slot.querySelector('.copy-btn');

        try {
            const controller = new AbortController();
            this.streamingControllers[slotIndex] = controller;

            const config = this.configManager.getConfig();
            const prompt = this.configManager.getPrompt(action);
            
            // Add slight variation to prompts for diversity
            const variations = [
                prompt,
                prompt + " Be concise and clear.",
                prompt + " Use a different style or approach."
            ];
            
            const fullPrompt = `${variations[slotIndex % variations.length]}\n\n"${originalText}"`;
            
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiManager.apiKey}`
                },
                body: JSON.stringify({
                    model: config.aiOptions.model,
                    messages: [{ role: 'user', content: fullPrompt }],
                    max_tokens: config.aiOptions.maxTokens,
                    temperature: Math.min(1.0, config.aiOptions.temperature + (slotIndex * 0.1)),
                    stream: true
                }),
                signal: controller.signal
            };

            const response = await fetch(this.apiManager.apiEndpoint, requestOptions);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            // Update status to streaming
            statusIndicator.innerHTML = '<div class="streaming-dots"><span></span><span></span><span></span></div>';
            textElement.classList.add('streaming');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            
                            if (content) {
                                fullResponse += content;
                                textElement.textContent = fullResponse;
                            }
                        } catch (parseError) {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }

            // Mark as completed
            textElement.classList.remove('streaming');
            statusIndicator.innerHTML = '<div class="check-icon">✓</div>';
            copyBtn.style.opacity = '1';
            copyBtn.style.pointerEvents = 'auto';
            slot.classList.add('completed');

            // Setup copy functionality
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this._copyToClipboard(fullResponse, slot);
            });

            // Make the whole suggestion clickable
            textElement.addEventListener('click', () => {
                this._copyToClipboard(fullResponse, slot);
            });

            this.currentResponses[slotIndex] = fullResponse;

        } catch (error) {
            if (error.name === 'AbortError') {
                statusIndicator.innerHTML = '<div class="cancelled-icon">⏸</div>';
                textElement.classList.remove('streaming');
            } else {
                console.error(`Stream ${slotIndex} error:`, error);
                statusIndicator.innerHTML = '<div class="error-icon">⚠</div>';
                textElement.classList.remove('streaming');
                slot.classList.add('error');
                textElement.textContent = 'Failed to generate suggestion. Please try again.';
            }
        }
    }

    async _copyToClipboard(text, slot) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            // Fallback for older browsers
            this._fallbackCopyToClipboard(text);
        }
        
        // Show feedback
        const overlay = slot.querySelector('.suggestion-overlay');
        overlay.classList.add('show');
        
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 1500);
    }

    _fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    _handleOutsideClick(event) {
        if (this.suggestionBox && !this.suggestionBox.contains(event.target)) {
            this.hide();
        }
    }

    _injectStyles() {
        if (document.getElementById('verba-suggestion-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'verba-suggestion-styles';
        styles.textContent = `
            .verba-suggestion-box {
                background: var(--background-primary);
                border-radius: 8px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.24),
                    0 0 0 1px var(--background-modifier-accent);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                backdrop-filter: blur(8px);
                font-family: var(--font-primary);
            }

            .suggestion-header {
                padding: 16px 18px 14px 18px;
                background: var(--background-secondary);
                border-bottom: 1px solid var(--background-modifier-accent);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-content {
                flex: 1;
            }

            .header-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 2px;
            }

            .magic-icon {
                font-size: 16px;
                filter: hue-rotate(0deg);
                animation: sparkle 2s ease-in-out infinite;
            }

            @keyframes sparkle {
                0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
                50% { transform: scale(1.1); filter: hue-rotate(90deg); }
            }

            .title-text {
                color: var(--header-primary);
                font-size: 15px;
                font-weight: 600;
                letter-spacing: -0.01em;
            }

            .header-subtitle {
                color: var(--text-muted);
                font-size: 12px;
                margin-left: 24px;
            }

            .header-actions {
                display: flex;
                gap: 6px;
            }

            .action-btn {
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 5px;
                background: transparent;
                color: var(--text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                position: relative;
            }

            .action-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
                transform: scale(1.05);
            }

            .action-btn:active {
                transform: scale(0.95);
            }

            .suggestions-container {
                flex: 1;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                max-height: 350px;
            }

            .suggestions-container::-webkit-scrollbar {
                width: 6px;
            }

            .suggestions-container::-webkit-scrollbar-track {
                background: transparent;
            }

            .suggestions-container::-webkit-scrollbar-thumb {
                background: var(--scrollbar-auto-thumb);
                border-radius: 3px;
            }

            .suggestion-slot {
                border-radius: 6px;
                background: var(--background-secondary);
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }

            .suggestion-slot:hover {
                background: var(--background-secondary-alt);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .suggestion-slot.completed:hover {
                cursor: pointer;
            }

            .suggestion-slot.error {
                background: color-mix(in srgb, var(--red-400) 8%, var(--background-secondary));
            }

            .suggestion-content {
                padding: 12px;
                display: flex;
                gap: 10px;
                align-items: flex-start;
            }

            .suggestion-text-container {
                flex: 1;
                position: relative;
                min-height: 40px;
            }

            .suggestion-text {
                color: var(--text-normal);
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
                word-break: break-word;
                position: relative;
                min-height: 40px;
                padding-right: 8px;
            }

            .suggestion-text:empty::before {
                content: attr(data-placeholder);
                color: var(--text-muted);
                font-style: italic;
            }

            .suggestion-text.streaming::after {
                content: '▌';
                animation: blink 1s infinite;
                color: var(--brand-experiment);
                margin-left: 2px;
            }

            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }

            .suggestion-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--brand-experiment);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                opacity: 0;
                transform: scale(0.9);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }

            .suggestion-overlay.show {
                opacity: 0.95;
                transform: scale(1);
            }

            .copy-feedback {
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .copy-feedback::before {
                content: '✓';
                font-size: 16px;
            }

            .suggestion-actions {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                min-width: 32px;
            }

            .suggestion-status {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .loading-spinner {
                width: 14px;
                height: 14px;
                border: 2px solid var(--background-modifier-accent);
                border-top: 2px solid var(--brand-experiment);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .streaming-dots {
                display: flex;
                gap: 3px;
            }

            .streaming-dots span {
                width: 4px;
                height: 4px;
                background: var(--brand-experiment);
                border-radius: 50%;
                animation: streamingPulse 1.4s infinite ease-in-out;
            }

            .streaming-dots span:nth-child(1) { animation-delay: -0.32s; }
            .streaming-dots span:nth-child(2) { animation-delay: -0.16s; }
            .streaming-dots span:nth-child(3) { animation-delay: 0s; }

            @keyframes streamingPulse {
                0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1); }
            }

            .check-icon {
                color: var(--green-360);
                font-weight: 600;
                font-size: 14px;
            }

            .error-icon {
                color: var(--red-400);
                font-size: 12px;
            }

            .cancelled-icon {
                color: var(--text-muted);
                font-size: 12px;
            }

            .copy-btn {
                width: 24px;
                height: 24px;
                border: none;
                border-radius: 4px;
                background: var(--background-modifier-hover);
                color: var(--text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .copy-btn:hover {
                background: var(--brand-experiment);
                color: white;
                transform: scale(1.1);
            }

            .copy-btn:active {
                transform: scale(0.9);
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .suggestion-header {
                    padding: 12px 14px 10px 14px;
                }

                .header-subtitle {
                    font-size: 11px;
                }

                .suggestions-container {
                    padding: 8px;
                    gap: 6px;
                }

                .suggestion-content {
                    padding: 10px;
                }

                .suggestion-text {
                    font-size: 13px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    _removeStyles() {
        const styles = document.getElementById('verba-suggestion-styles');
        if (styles) styles.remove();
        
        document.removeEventListener('click', this._handleOutsideClick.bind(this));
    }
}

module.exports = SuggestionBox;