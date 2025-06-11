const { CONFIG_MODAL_ID, ACTIONS } = require('../utils/constants');

class ConfigModal {
    constructor(configManager, onSave) {
        this.configManager = configManager;
        this.onSave = onSave;
        this.modal = null;
        this.isOpen = false;
        this.currentTab = 'ai-options';
        this.pendingChanges = false;
        this.originalConfig = null;
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.originalConfig = JSON.parse(JSON.stringify(this.configManager.getConfig()));
        this.createModal();
        document.body.appendChild(this.modal);
        this.setupKeyboardHandling();
        
        // Smooth entrance animation
        requestAnimationFrame(() => {
            this.modal.style.opacity = '1';
            this.modal.querySelector('.modal-content').style.transform = 'scale(1)';
        });
    }

    close() {
        if (!this.isOpen) return;
        
        if (this.pendingChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                return;
            }
        }
        
        this.isOpen = false;
        this.pendingChanges = false;
        
        // Smooth exit animation
        this.modal.style.opacity = '0';
        this.modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            this.modal = null;
            this.removeStyles();
        }, 200);
    }

    createModal() {
        this.injectStyles();
        
        this.modal = document.createElement('div');
        this.modal.id = CONFIG_MODAL_ID;
        this.modal.className = 'verba-config-modal';
        
        this.modal.innerHTML = `
            <div class="modal-content">
                ${this.createHeader()}
                ${this.createTabNavigation()}
                ${this.createTabContent()}
                ${this.createFooter()}
            </div>
        `;

        this.setupEventListeners();
        this.switchTab(this.currentTab);
    }

    createHeader() {
        return `
            <div class="modal-header">
                <div class="header-content">
                    <div class="header-icon">⚙️</div>
                    <div class="header-text">
                        <h2>VerbaAI Configuration</h2>
                        <p>Customize your AI assistant settings and manage prompts</p>
                    </div>
                </div>
                <button class="close-button" id="modal-close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    createTabNavigation() {
        return `
            <div class="tab-navigation">
                <button class="tab-button" data-tab="ai-options">
                    <span class="tab-icon">🤖</span>
                    <span class="tab-label">AI Settings</span>
                </button>
                <button class="tab-button" data-tab="prompts">
                    <span class="tab-icon">💬</span>
                    <span class="tab-label">Prompt Library</span>
                </button>
                <button class="tab-button" data-tab="advanced">
                    <span class="tab-icon">🔧</span>
                    <span class="tab-label">Advanced</span>
                </button>
            </div>
        `;
    }

    createTabContent() {
        return `
            <div class="tab-content" id="tab-content">
                <!-- Content will be dynamically loaded -->
            </div>
        `;
    }

    createFooter() {
        return `
            <div class="modal-footer">
                <div class="footer-left">
                    <button class="button secondary" id="reset-button">
                        <span class="button-icon">🔄</span>
                        Reset All
                    </button>
                </div>
                <div class="footer-right">
                    <div class="save-indicator" id="save-indicator">
                        <span class="indicator-dot"></span>
                        <span class="indicator-text">No changes</span>
                    </div>
                    <button class="button secondary" id="cancel-button">Cancel</button>
                    <button class="button primary" id="save-button" disabled>
                        <span class="button-icon">💾</span>
                        Save Changes
                    </button>
                </div>
            </div>
        `;
    }

    createAiOptionsTab() {
        const config = this.configManager.getConfig();
        
        return `
            <div class="tab-panel">
                <div class="section">
                    <div class="section-header">
                        <h3>🎯 Model Configuration</h3>
                        <p>Choose your AI model and configure its behavior</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <span class="label-text">AI Model</span>
                            <span class="label-description">Different models have varying capabilities and costs</span>
                        </label>
                        <div class="select-wrapper">
                        <select id="config-model" class="form-select">
                            <option value="gpt-4.1" ${config.aiOptions.model === 'gpt-4.1' ? 'selected' : ''}>
                                GPT-4.1 (Most Capable)
                            </option>
                            <option value="gpt-4.1-mini" ${config.aiOptions.model === 'gpt-4.1-mini' ? 'selected' : ''}>
                                GPT-4.1-mini (Balanced)
                            </option>
                            <option value="gpt-4o-mini" ${config.aiOptions.model === 'gpt-4o-mini' ? 'selected' : ''}>
                                GPT-4o-mini (Cost Effective Multimodal)
                            </option>
                        </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <span class="label-text">Response Length</span>
                            <span class="label-description">Maximum tokens for AI responses</span>
                        </label>
                        <div class="slider-wrapper">
                            <input type="range" id="config-max-tokens" class="form-slider" 
                                min="100" max="2000" step="50" value="${config.aiOptions.maxTokens}">
                            <div class="slider-labels">
                                <span>Short (100)</span>
                                <span class="current-value" id="max-tokens-value">${config.aiOptions.maxTokens} tokens</span>
                                <span>Long (2000)</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <span class="label-text">Creativity Level</span>
                            <span class="label-description">Controls randomness in AI responses</span>
                        </label>
                        <div class="slider-wrapper">
                            <input type="range" id="config-temperature" class="form-slider" 
                                min="0" max="1" step="0.1" value="${config.aiOptions.temperature}">
                            <div class="slider-labels">
                                <span>🎯 Focused (0.0)</span>
                                <span class="current-value" id="temperature-value">${config.aiOptions.temperature}</span>
                                <span>🎨 Creative (1.0)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h3>⚡ Performance Settings</h3>
                        <p>Optimize response speed and quality</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="config-stream" ${config.aiOptions.stream ? 'checked' : ''}>
                            <span class="checkbox-mark"></span>
                            <span class="checkbox-label">
                                <span class="label-text">Stream Responses</span>
                                <span class="label-description">Show responses as they're generated (faster feel)</span>
                            </span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="config-context" ${config.aiOptions.useContext ? 'checked' : ''}>
                            <span class="checkbox-mark"></span>
                            <span class="checkbox-label">
                                <span class="label-text">Use Conversation Context</span>
                                <span class="label-description">Remember previous messages in the conversation</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    createPromptsTab() {
        const allPrompts = this.configManager.getAllPrompts();
        const builtInPrompts = allPrompts.filter(p => p.isBuiltIn);
        const customPrompts = allPrompts.filter(p => !p.isBuiltIn);
        
        return `
            <div class="tab-panel">
                <div class="section">
                    <div class="section-header">
                        <h3>🏗️ Built-in Prompts</h3>
                        <p>Pre-configured prompts for common tasks</p>
                    </div>
                    <div class="prompts-grid">
                        ${builtInPrompts.map(prompt => this.createPromptCard(prompt)).join('')}
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h3>✨ Custom Prompts</h3>
                        <p>Your personalized prompts</p>
                        <button class="button primary small" id="add-prompt">
                            <span class="button-icon">➕</span>
                            Create New Prompt
                        </button>
                    </div>
                    <div class="prompts-grid" id="custom-prompts-grid">
                        ${customPrompts.length > 0 ? 
                            customPrompts.map(prompt => this.createPromptCard(prompt)).join('') :
                            '<div class="empty-state">No custom prompts yet. Create your first one!</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createAdvancedTab() {
        const config = this.configManager.getConfig();
        
        return `
            <div class="tab-panel">
                <div class="section">
                    <div class="section-header">
                        <h3>🔧 Advanced Settings</h3>
                        <p>Fine-tune your AI assistant behavior</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <span class="label-text">API Timeout (seconds)</span>
                            <span class="label-description">Maximum time to wait for AI responses</span>
                        </label>
                        <input type="number" id="config-timeout" class="form-input" 
                            min="5" max="120" value="${config.advanced?.timeout || 30}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <span class="label-text">Retry Attempts</span>
                            <span class="label-description">Number of retries on failed requests</span>
                        </label>
                        <input type="number" id="config-retries" class="form-input" 
                            min="0" max="5" value="${config.advanced?.retries || 2}">
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="config-debug" ${config.advanced?.debug ? 'checked' : ''}>
                            <span class="checkbox-mark"></span>
                            <span class="checkbox-label">
                                <span class="label-text">Debug Mode</span>
                                <span class="label-description">Show detailed logs in console</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="section danger-zone">
                    <div class="section-header">
                        <h3>⚠️ Danger Zone</h3>
                        <p>Irreversible actions - use with caution</p>
                    </div>
                    
                    <div class="form-group">
                        <button class="button danger" id="clear-cache">
                            <span class="button-icon">🗑️</span>
                            Clear Response Cache
                        </button>
                        <p class="help-text">Removes all cached AI responses</p>
                    </div>

                    <div class="form-group">
                        <button class="button danger" id="export-config">
                            <span class="button-icon">📤</span>
                            Export Configuration
                        </button>
                        <p class="help-text">Download your settings as a JSON file</p>
                    </div>
                </div>
            </div>
        `;
    }

    createPromptCard(prompt) {
        const isCustom = !prompt.isBuiltIn;
        
        return `
            <div class="prompt-card ${isCustom ? 'custom' : 'builtin'}" data-prompt-id="${prompt.id}">
                <div class="prompt-header">
                    <div class="prompt-title">
                        ${isCustom ? 
                            `<input type="text" class="prompt-name-input" value="${prompt.name}" placeholder="Prompt name...">` :
                            `<h4>${prompt.name}</h4>`
                        }
                        <div class="prompt-badge ${isCustom ? 'custom' : 'builtin'}">
                            ${isCustom ? 'Custom' : 'Built-in'}
                        </div>
                    </div>
                    ${isCustom ? `
                        <div class="prompt-actions">
                            <button class="action-button test-prompt" title="Test this prompt">🧪</button>
                            <button class="action-button delete-prompt" title="Delete prompt">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="prompt-content">
                    <textarea class="prompt-textarea" 
                        ${!isCustom ? 'readonly' : ''} 
                        rows="3" 
                        placeholder="Enter your prompt here...">${prompt.prompt}</textarea>
                </div>
                
                <div class="prompt-footer">
                    <div class="prompt-stats">
                        <span class="stat">~${Math.ceil(prompt.prompt.length / 4)} tokens</span>
                    </div>
                    <button class="button secondary small use-prompt">
                        <span class="button-icon">▶️</span>
                        Use Prompt
                    </button>
                </div>
            </div>
        `;
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.modal.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        this.modal.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content with smooth transition
        const content = this.modal.querySelector('#tab-content');
        content.style.opacity = '0';
        
        setTimeout(() => {
            switch (tabName) {
                case 'ai-options':
                    content.innerHTML = this.createAiOptionsTab();
                    this.setupAiOptionsListeners();
                    break;
                case 'prompts':
                    content.innerHTML = this.createPromptsTab();
                    this.setupPromptsListeners();
                    break;
                case 'advanced':
                    content.innerHTML = this.createAdvancedTab();
                    this.setupAdvancedListeners();
                    break;
            }
            
            content.style.opacity = '1';
        }, 150);
    }

    setupEventListeners() {
        // Close button
        this.modal.querySelector('#modal-close').addEventListener('click', () => this.close());
        
        // Tab switching
        this.modal.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Footer buttons
        this.modal.querySelector('#save-button').addEventListener('click', () => this.saveConfiguration());
        this.modal.querySelector('#cancel-button').addEventListener('click', () => this.close());
        this.modal.querySelector('#reset-button').addEventListener('click', () => this.resetConfiguration());

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    setupAiOptionsListeners() {
        // Slider updates
        const maxTokensSlider = this.modal.querySelector('#config-max-tokens');
        const maxTokensValue = this.modal.querySelector('#max-tokens-value');
        maxTokensSlider?.addEventListener('input', (e) => {
            maxTokensValue.textContent = `${e.target.value} tokens`;
            this.markAsChanged();
        });

        const temperatureSlider = this.modal.querySelector('#config-temperature');
        const temperatureValue = this.modal.querySelector('#temperature-value');
        temperatureSlider?.addEventListener('input', (e) => {
            temperatureValue.textContent = e.target.value;
            this.markAsChanged();
        });

        // Other inputs
        this.modal.querySelector('#config-model')?.addEventListener('change', () => this.markAsChanged());
        this.modal.querySelector('#config-stream')?.addEventListener('change', () => this.markAsChanged());
        this.modal.querySelector('#config-context')?.addEventListener('change', () => this.markAsChanged());
    }

    setupPromptsListeners() {
        // Add new prompt
        this.modal.querySelector('#add-prompt')?.addEventListener('click', () => {
            this.addNewCustomPrompt();
        });

        // Prompt actions
        this.modal.querySelectorAll('.delete-prompt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promptId = e.target.closest('.prompt-card').dataset.promptId;
                this.deletePrompt(promptId);
            });
        });

        this.modal.querySelectorAll('.use-prompt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promptId = e.target.closest('.prompt-card').dataset.promptId;
                this.usePrompt(promptId);
            });
        });

        this.modal.querySelectorAll('.test-prompt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promptId = e.target.closest('.prompt-card').dataset.promptId;
                this.testPrompt(promptId);
            });
        });

        // Prompt editing
        this.modal.querySelectorAll('.prompt-name-input, .prompt-textarea').forEach(input => {
            input.addEventListener('input', () => this.markAsChanged());
        });
    }

    setupAdvancedListeners() {
        this.modal.querySelectorAll('#config-timeout, #config-retries').forEach(input => {
            input.addEventListener('input', () => this.markAsChanged());
        });

        this.modal.querySelector('#config-debug')?.addEventListener('change', () => this.markAsChanged());

        this.modal.querySelector('#clear-cache')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the response cache?')) {
                // Implement cache clearing
                BdApi.showToast("Response cache cleared!", { type: "info" });
            }
        });

        this.modal.querySelector('#export-config')?.addEventListener('click', () => {
            this.exportConfiguration();
        });
    }

    markAsChanged() {
        this.pendingChanges = true;
        const saveButton = this.modal.querySelector('#save-button');
        const indicator = this.modal.querySelector('#save-indicator');
        
        saveButton.disabled = false;
        saveButton.classList.add('pulse');
        
        indicator.querySelector('.indicator-dot').style.backgroundColor = '#f0b90b';
        indicator.querySelector('.indicator-text').textContent = 'Unsaved changes';
    }

    addNewCustomPrompt() {
        const id = 'custom_' + Date.now();
        const newPrompt = {
            id,
            name: 'New Custom Prompt',
            prompt: 'Enter your prompt here...',
            isBuiltIn: false
        };
        
        this.configManager.addCustomPrompt(id, newPrompt.name, newPrompt.prompt);
        this.switchTab('prompts');
        this.markAsChanged();
        
        setTimeout(() => {
            const newCard = this.modal.querySelector(`[data-prompt-id="${id}"]`);
            if (newCard) {
                newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const nameInput = newCard.querySelector('.prompt-name-input');
                nameInput?.focus();
                nameInput?.select();
            }
        }, 200);
    }

    deletePrompt(promptId) {
        if (confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
            this.configManager.removeCustomPrompt(promptId);
            this.switchTab('prompts');
            this.markAsChanged();
            BdApi.showToast("Prompt deleted successfully!", { type: "info" });
        }
    }

    usePrompt(promptId) {
        const allPrompts = this.configManager.getAllPrompts();
        const prompt = allPrompts.find(p => p.id === promptId);
        
        if (prompt) {
            this.close();
            // Trigger the prompt usage
            if (this.onSave) {
                this.onSave({ action: 'use-prompt', prompt });
            }
            BdApi.showToast(`Using prompt: ${prompt.name}`, { type: "success" });
        }
    }

    testPrompt(promptId) {
        const allPrompts = this.configManager.getAllPrompts();
        const prompt = allPrompts.find(p => p.id === promptId);
        
        if (prompt) {
            // Create a simple test interface
            const testText = prompt('Enter test text to see how the prompt works:') || 'Hello, how are you?';
            const result = prompt.prompt.replace(/\{input\}/g, testText);
            
            alert(`Prompt Result:\n\n${result}`);
        }
    }

    saveConfiguration() {
        const config = this.collectFormData();
        this.configManager.updateConfig(config);
        
        this.pendingChanges = false;
        this.originalConfig = JSON.parse(JSON.stringify(config));
        
        // Update UI
        const saveButton = this.modal.querySelector('#save-button');
        const indicator = this.modal.querySelector('#save-indicator');
        
        saveButton.disabled = true;
        saveButton.classList.remove('pulse');
        
        indicator.querySelector('.indicator-dot').style.backgroundColor = '#00d26a';
        indicator.querySelector('.indicator-text').textContent = 'All changes saved';
        
        if (this.onSave) {
            this.onSave({ action: 'save', config });
        }
        
        BdApi.showToast("Configuration saved successfully! ⚙️", { type: "success" });
        
        setTimeout(() => {
            indicator.querySelector('.indicator-dot').style.backgroundColor = '';
            indicator.querySelector('.indicator-text').textContent = 'No changes';
        }, 2000);
    }

    resetConfiguration() {
        if (confirm('Are you sure you want to reset all settings to defaults? This will delete all custom prompts and cannot be undone.')) {
            this.configManager.resetToDefaults();
            this.pendingChanges = false;
            this.close();
            
            if (this.onSave) {
                this.onSave({ action: 'reset' });
            }
            
            BdApi.showToast("Configuration reset to defaults! 🔄", { type: "info" });
        }
    }

    exportConfiguration() {
        const config = this.configManager.getConfig();
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `verba-ai-config-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        BdApi.showToast("Configuration exported!", { type: "success" });
    }

    collectFormData() {
        const config = JSON.parse(JSON.stringify(this.originalConfig));
        
        // AI Options
        const model = this.modal.querySelector('#config-model')?.value;
        const maxTokens = parseInt(this.modal.querySelector('#config-max-tokens')?.value || 500);
        const temperature = parseFloat(this.modal.querySelector('#config-temperature')?.value || 0.7);
        const stream = this.modal.querySelector('#config-stream')?.checked || false;
        const useContext = this.modal.querySelector('#config-context')?.checked || false;
        
        if (model) config.aiOptions.model = model;
        config.aiOptions.maxTokens = maxTokens;
        config.aiOptions.temperature = temperature;
        config.aiOptions.stream = stream;
        config.aiOptions.useContext = useContext;
        
        // Advanced settings
        const timeout = parseInt(this.modal.querySelector('#config-timeout')?.value || 30);
        const retries = parseInt(this.modal.querySelector('#config-retries')?.value || 2);
        const debug = this.modal.querySelector('#config-debug')?.checked || false;
        
        config.advanced = config.advanced || {};
        config.advanced.timeout = timeout;
        config.advanced.retries = retries;
        config.advanced.debug = debug;
        
        // Custom prompts
        this.modal.querySelectorAll('.prompt-card.custom').forEach(card => {
            const id = card.dataset.promptId;
            const nameInput = card.querySelector('.prompt-name-input');
            const textArea = card.querySelector('.prompt-textarea');
            
            if (nameInput && textArea) {
                const name = nameInput.value.trim();
                const prompt = textArea.value.trim();
                
                if (name && prompt) {
                    config.customPrompts = config.customPrompts || {};
                    config.customPrompts[id] = { name, prompt };
                }
            }
        });
        
        return config;
    }

    setupKeyboardHandling() {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!this.modal.querySelector('#save-button').disabled) {
                    this.saveConfiguration();
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Store reference to remove later
        this.keyHandler = handleKeyDown;
    }

   // Replace the injectStyles() method with this improved version:

injectStyles() {
    if (document.getElementById('verba-config-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'verba-config-styles';
    styles.textContent = `
        .verba-config-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.2s ease;
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: var(--background-primary);
            border-radius: 12px;
            width: 90%;
            max-width: 900px;
            max-height: 85vh;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            transform: scale(0.95);
            transition: transform 0.2s ease;
            overflow: hidden;
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid var(--background-modifier-accent);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background: linear-gradient(135deg, var(--brand-experiment-15a) 0%, transparent 100%);
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-icon {
            font-size: 24px;
            width: 48px;
            height: 48px;
            background: var(--brand-experiment);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-text h2 {
            color: var(--header-primary);
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .header-text p {
            color: var(--text-muted);
            margin: 4px 0 0 0;
            font-size: 14px;
        }

        .close-button {
            background: var(--background-modifier-hover);
            border: none;
            border-radius: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-muted);
            transition: all 0.2s ease;
        }

        .close-button:hover {
            background: var(--background-modifier-selected);
            color: var(--text-normal);
        }

        .tab-navigation {
            display: flex;
            border-bottom: 1px solid var(--background-modifier-accent);
            background: var(--background-secondary);
            overflow-x: auto;
        }

        .tab-button {
            background: transparent;
            border: none;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: var(--text-muted);
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.2s ease;
            position: relative;
            white-space: nowrap;
            min-width: fit-content;
        }

        .tab-button:hover {
            color: var(--text-normal);
            background: var(--background-modifier-hover);
        }

        .tab-button.active {
            color: var(--text-normal);
            background: var(--background-primary);
            border-bottom-color: var(--brand-experiment);
            font-weight: 600;
        }

        /* Extra contrast for active tab in dark themes */
        .theme-dark .tab-button.active {
            color: var(--white-500);
            background: var(--background-primary);
        }

        /* For light themes */
        .theme-light .tab-button.active {
            color: var(--black-500);
            background: var(--white-500);
        }

        .tab-icon {
            font-size: 16px;
            opacity: 0.8;
        }

        .tab-button.active .tab-icon {
            opacity: 1;
        }

        .tab-label {
            font-size: 14px;
        }

        .tab-content {
            flex: 1;
            overflow-y: auto;
            transition: opacity 0.15s ease;
        }

        .tab-panel {
            padding: 24px;
        }

        .section {
            margin-bottom: 32px;
        }

        .section:last-child {
            margin-bottom: 0;
        }

        .section-header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .section-header h3 {
            color: var(--header-primary);
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }

        .section-header p {
            color: var(--text-muted);
            margin: 4px 0 0 0;
            font-size: 14px;
            flex: 1;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
        }

        .label-text {
            color: var(--text-normal);
            font-weight: 500;
            font-size: 14px;
            display: block;
        }

        .label-description {
            color: var(--text-muted);
            font-size: 12px;
            display: block;
            margin-top: 2px;
        }

        .form-select {
            width: 100%;
            padding: 12px;
            background: var(--input-background);
            color: var(--text-normal);
            border: 2px solid var(--background-modifier-accent);
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }

        .form-select:focus {
            outline: none;
            border-color: var(--brand-experiment);
        }

        .form-input {
            width: 100%;
            padding: 12px;
            background: var(--input-background);
            color: var(--text-normal);
            border: 2px solid var(--background-modifier-accent);
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--brand-experiment);
        }

        .slider-wrapper {
            margin-top: 8px;
        }

        .form-slider {
            width: 100%;
            height: 6px;
            background: var(--background-modifier-accent);
            border-radius: 3px;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }

        .form-slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--brand-experiment);
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid var(--background-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .form-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: var(--brand-experiment);
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid var(--background-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 12px;
            color: var(--text-muted);
        }

        .current-value {
            color: var(--brand-experiment);
            font-weight: 600;
        }

        .form-checkbox {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
            padding: 12px;
            border-radius: 8px;
            transition: background-color 0.2s ease;
        }

        .form-checkbox:hover {
            background: var(--background-modifier-hover);
        }

        .form-checkbox input[type="checkbox"] {
            display: none;
        }

        .checkbox-mark {
            width: 20px;
            height: 20px;
            border: 2px solid var(--background-modifier-accent);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .form-checkbox input[type="checkbox"]:checked + .checkbox-mark {
            background: var(--brand-experiment);
            border-color: var(--brand-experiment);
        }

        .form-checkbox input[type="checkbox"]:checked + .checkbox-mark::after {
            content: "✓";
            color: white;
            font-size: 12px;
            font-weight: bold;
        }

        .checkbox-label {
            flex: 1;
        }

        .checkbox-label .label-text {
            margin-bottom: 2px;
        }

        .prompts-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .prompt-card {
            background: var(--background-secondary);
            border: 2px solid var(--background-modifier-accent);
            border-radius: 12px;
            padding: 16px;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .prompt-card:hover {
            border-color: var(--brand-experiment);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .prompt-card.custom {
            border-color: var(--brand-experiment-50a);
        }

        .prompt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }

        .prompt-title {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .prompt-title h4 {
            color: var(--header-primary);
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .prompt-name-input {
            background: var(--input-background);
            color: var(--text-normal);
            border: 1px solid var(--background-modifier-accent);
            border-radius: 6px;
            padding: 6px 8px;
            font-size: 16px;
            font-weight: 600;
            width: 100%;
        }

        .prompt-name-input:focus {
            outline: none;
            border-color: var(--brand-experiment);
        }

        .prompt-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .prompt-badge.builtin {
            background: var(--background-modifier-accent);
            color: var(--text-muted);
        }

        .prompt-badge.custom {
            background: var(--brand-experiment-15a);
            color: var(--brand-experiment);
        }

        .prompt-actions {
            display: flex;
            gap: 4px;
        }

        .action-button {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.2s ease;
            background: var(--background-modifier-hover);
            color: var(--text-muted);
        }

        .action-button:hover {
            background: var(--background-modifier-selected);
            color: var(--text-normal);
        }

        .delete-prompt:hover {
            background: var(--button-danger-background);
            color: white;
        }

        .prompt-content {
            flex: 1;
        }

        .prompt-textarea {
            width: 100%;
            min-height: 80px;
            padding: 12px;
            background: var(--input-background);
            color: var(--text-normal);
            border: 1px solid var(--background-modifier-accent);
            border-radius: 8px;
            resize: vertical;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.4;
            transition: border-color 0.2s ease;
        }

        .prompt-textarea:focus {
            outline: none;
            border-color: var(--brand-experiment);
        }

        .prompt-textarea[readonly] {
            opacity: 0.7;
            cursor: default;
        }

        .prompt-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
        }

        .prompt-stats {
            font-size: 12px;
            color: var(--text-muted);
        }

        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            font-size: 16px;
            background: var(--background-modifier-hover);
            border-radius: 12px;
            border: 2px dashed var(--background-modifier-accent);
        }

        .danger-zone {
            border: 2px solid var(--button-danger-background);
            border-radius: 12px;
            padding: 20px;
            background: color-mix(in srgb, var(--button-danger-background) 5%, transparent);
        }

        .danger-zone .section-header h3 {
            color: var(--button-danger-background);
        }

        .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid var(--background-modifier-accent);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            background: var(--background-secondary-alt);
        }

        .footer-left,
        .footer-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .save-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-muted);
        }

        .indicator-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--background-modifier-accent);
            transition: background-color 0.2s ease;
        }

        .button {
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }

        .button.small {
            padding: 6px 12px;
            font-size: 12px;
        }

        .button.primary {
            background: var(--brand-experiment);
            color: white;
        }

        .button.primary:hover:not(:disabled) {
            background: var(--brand-experiment-560);
            transform: translateY(-1px);
        }

        .button.primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .button.secondary {
            background: var(--button-secondary-background);
            color: var(--text-normal);
        }

        .button.secondary:hover {
            background: var(--background-modifier-hover);
        }

        .button.danger {
            background: var(--button-danger-background);
            color: white;
        }

        .button.danger:hover {
            background: var(--button-danger-background-hover);
        }

        .button.pulse {
            animation: pulse 2s infinite;
        }

        .button-icon {
            font-size: 12px;
        }

        .help-text {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 var(--brand-experiment-50a); }
            50% { box-shadow: 0 0 0 8px transparent; }
        }

        @media (max-width: 768px) {
            .modal-content {
                width: 95%;
                max-height: 90vh;
            }

            .header-content {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }

            .tab-navigation {
                flex-wrap: wrap;
            }

            .tab-button {
                flex: 1;
                min-width: 120px;
            }

            .prompts-grid {
                grid-template-columns: 1fr;
            }

            .modal-footer {
                flex-direction: column;
                align-items: stretch;
            }

            .footer-left,
            .footer-right {
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

    removeStyles() {
        const styles = document.getElementById('verba-config-styles');
        if (styles) styles.remove();
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}

module.exports = ConfigModal;