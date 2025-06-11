const { CONFIG_MODAL_ID, ACTIONS } = require('../utils/constants');

class ConfigModal {
    constructor(configManager, onSave) {
        this.configManager = configManager;
        this.onSave = onSave;
        this.modal = null;
        this.isOpen = false;
        this.currentTab = 'ai-options';
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.createModal();
        document.body.appendChild(this.modal);
        
        // Focus trap and ESC key handling
        this.setupKeyboardHandling();
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }

    createModal() {
        const config = this.configManager.getConfig();
        
        this.modal = document.createElement('div');
        this.modal.id = CONFIG_MODAL_ID;
        this.modal.style.cssText = `
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
            animation: fadeIn 0.2s ease-out;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--background-primary);
            border-radius: 8px;
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: var(--elevation-high);
            animation: slideIn 0.2s ease-out;
            display: flex;
            flex-direction: column;
        `;

        modalContent.innerHTML = `
            <div style="padding: 24px; border-bottom: 1px solid var(--background-modifier-accent);">
                <h2 style="color: var(--header-primary); margin: 0; font-size: 20px; font-weight: 600;">
                    ⚙️ VerbaAi Configuration
                </h2>
                <p style="color: var(--text-muted); margin: 8px 0 0 0; font-size: 14px;">
                    Customize AI options and manage prompts
                </p>
            </div>

            <!-- Tab Navigation -->
            <div style="display: flex; border-bottom: 1px solid var(--background-modifier-accent);">
                <button id="tab-ai-options" class="config-tab active" data-tab="ai-options">
                    🤖 AI Options
                </button>
                <button id="tab-prompts" class="config-tab" data-tab="prompts">
                    💬 Prompts
                </button>
            </div>

            <!-- Tab Content -->
            <div style="flex: 1; overflow-y: auto; padding: 24px;" id="tab-content">
                ${this.createAiOptionsTab(config)}
            </div>

            <div style="padding: 16px 24px; border-top: 1px solid var(--background-modifier-accent); display: flex; justify-content: space-between; align-items: center;">
                <button id="config-reset" style="background: var(--button-danger-background); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    Reset to Defaults
                </button>
                <div style="display: flex; gap: 8px;">
                    <button id="config-cancel" style="background: var(--button-secondary-background); color: var(--text-normal); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">
                        Cancel
                    </button>
                    <button id="config-save" style="background: var(--brand-experiment); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">
                        Save Changes
                    </button>
                </div>
            </div>
        `;

        this.modal.appendChild(modalContent);
        this.setupEventListeners();
        this.injectTabStyles();
    }

    createAiOptionsTab(config) {
        return `
            <div id="ai-options-content">
                <h3 style="color: var(--header-secondary); margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                    🤖 AI Configuration
                </h3>
                
                <div style="display: grid; gap: 16px;">
                    <div>
                        <label style="display: block; color: var(--text-normal); font-weight: 500; margin-bottom: 8px;">
                            Model
                        </label>
                        <select id="config-model" style="width: 100%; padding: 8px; background: var(--input-background); color: var(--text-normal); border: 1px solid var(--background-modifier-accent); border-radius: 4px;">
                            <option value="gpt-3.5-turbo" ${config.aiOptions.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                            <option value="gpt-4" ${config.aiOptions.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                            <option value="gpt-4-turbo" ${config.aiOptions.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; color: var(--text-normal); font-weight: 500; margin-bottom: 8px;">
                            Max Tokens: <span id="max-tokens-value">${config.aiOptions.maxTokens}</span>
                        </label>
                        <input type="range" id="config-max-tokens" min="100" max="2000" step="50" value="${config.aiOptions.maxTokens}" 
                            style="width: 100%; accent-color: var(--brand-experiment);">
                    </div>

                    <div>
                        <label style="display: block; color: var(--text-normal); font-weight: 500; margin-bottom: 8px;">
                            Temperature: <span id="temperature-value">${config.aiOptions.temperature}</span>
                        </label>
                        <input type="range" id="config-temperature" min="0" max="1" step="0.1" value="${config.aiOptions.temperature}" 
                            style="width: 100%; accent-color: var(--brand-experiment);">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            <span>Focused</span>
                            <span>Creative</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createPromptsTab() {
        const allPrompts = this.configManager.getAllPrompts();
        
        return `
            <div id="prompts-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="color: var(--header-secondary); margin: 0; font-size: 16px; font-weight: 600;">
                        💬 Prompt Management
                    </h3>
                    <button id="add-custom-prompt" style="background: var(--brand-experiment); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">
                        ➕ Add Custom Prompt
                    </button>
                </div>
                
                <div id="prompts-list" style="display: grid; gap: 12px;">
                    ${allPrompts.map(prompt => this.createPromptItem(prompt)).join('')}
                </div>
            </div>
        `;
    }

    createPromptItem(prompt) {
        const isEditable = !prompt.isBuiltIn;
        
        return `
            <div class="prompt-item" data-prompt-id="${prompt.id}" style="background: var(--background-secondary); padding: 16px; border-radius: 6px; border: 1px solid var(--background-modifier-accent);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            ${prompt.isBuiltIn ? 
                                `<span style="color: var(--text-normal); font-weight: 600;">${prompt.name}</span>
                                 <span style="background: var(--background-modifier-accent); color: var(--text-muted); padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600;">BUILT-IN</span>` :
                                `<input type="text" class="prompt-name" value="${prompt.name}" style="background: var(--input-background); color: var(--text-normal); border: 1px solid var(--background-modifier-accent); border-radius: 4px; padding: 4px 8px; font-weight: 600; font-size: 14px;" placeholder="Prompt name...">`
                            }
                        </div>
                        <textarea class="prompt-text" rows="3" ${!isEditable ? 'readonly' : ''} 
                            style="width: 100%; padding: 8px; background: var(--input-background); color: var(--text-normal); border: 1px solid var(--background-modifier-accent); border-radius: 4px; resize: vertical; font-family: inherit; ${!isEditable ? 'opacity: 0.7;' : ''}"
                            placeholder="Enter your custom prompt...">${prompt.prompt}</textarea>
                    </div>
                    ${isEditable ? `
                        <div style="display: flex; gap: 4px; margin-left: 12px;">
                            <button class="delete-prompt" data-prompt-id="${prompt.id}" style="background: var(--button-danger-background); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Delete prompt">
                                🗑️
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${isEditable ? `
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button class="use-prompt" data-prompt-id="${prompt.id}" style="background: var(--brand-experiment); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Use This Prompt
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.modal.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        this.modal.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content
        const content = this.modal.querySelector('#tab-content');
        if (tabName === 'ai-options') {
            content.innerHTML = this.createAiOptionsTab(this.configManager.getConfig());
            this.setupAiOptionsListeners();
        } else if (tabName === 'prompts') {
            content.innerHTML = this.createPromptsTab();
            this.setupPromptsListeners();
        }
    }

    setupEventListeners() {
        // Tab switching
        this.modal.querySelectorAll('.config-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Set up initial tab listeners
        this.setupAiOptionsListeners();

        // Button handlers
        this.modal.querySelector('#config-save').addEventListener('click', () => {
            this.saveConfiguration();
        });

        this.modal.querySelector('#config-cancel').addEventListener('click', () => {
            this.close();
        });

        this.modal.querySelector('#config-reset').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to defaults? This will delete all custom prompts and cannot be undone.')) {
                this.resetConfiguration();
            }
        });

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    setupAiOptionsListeners() {
        // Range input updates
        const maxTokensSlider = this.modal.querySelector('#config-max-tokens');
        const maxTokensValue = this.modal.querySelector('#max-tokens-value');
        if (maxTokensSlider && maxTokensValue) {
            maxTokensSlider.addEventListener('input', (e) => {
                maxTokensValue.textContent = e.target.value;
            });
        }

        const temperatureSlider = this.modal.querySelector('#config-temperature');
        const temperatureValue = this.modal.querySelector('#temperature-value');
        if (temperatureSlider && temperatureValue) {
            temperatureSlider.addEventListener('input', (e) => {
                temperatureValue.textContent = e.target.value;
            });
        }
    }

    setupPromptsListeners() {
        // Add custom prompt button
        const addButton = this.modal.querySelector('#add-custom-prompt');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.addNewCustomPrompt();
            });
        }

        // Delete prompt buttons
        this.modal.querySelectorAll('.delete-prompt').forEach(button => {
            button.addEventListener('click', (e) => {
                const promptId = e.target.dataset.promptId;
                if (confirm('Are you sure you want to delete this custom prompt?')) {
                    this.deleteCustomPrompt(promptId);
                }
            });
        });

        // Use prompt buttons
        this.modal.querySelectorAll('.use-prompt').forEach(button => {
            button.addEventListener('click', (e) => {
                const promptId = e.target.dataset.promptId;
                this.useCustomPrompt(promptId);
            });
        });
    }

    addNewCustomPrompt() {
        const id = 'custom_' + Date.now();
        const name = 'New Custom Prompt';
        const prompt = 'Enter your custom prompt here...';
        
        this.configManager.addCustomPrompt(id, name, prompt);
        this.switchTab('prompts'); // Refresh the prompts tab
        
        // Focus on the new prompt
        setTimeout(() => {
            const newPromptItem = this.modal.querySelector(`[data-prompt-id="${id}"]`);
            if (newPromptItem) {
                const nameInput = newPromptItem.querySelector('.prompt-name');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }
        }, 100);
    }

    deleteCustomPrompt(promptId) {
        this.configManager.removeCustomPrompt(promptId);
        this.switchTab('prompts'); // Refresh the prompts tab
        BdApi.showToast("Custom prompt deleted! 🗑️", { type: "info" });
    }

    useCustomPrompt(promptId) {
        // This simulates clicking the prompt action
        const customPrompts = this.configManager.getCustomPrompts();
        if (customPrompts[promptId]) {
            this.close();
            // You would need to implement a way to trigger the custom prompt
            // For now, we'll just show a message
            BdApi.showToast(`Using custom prompt: ${customPrompts[promptId].name}`, { type: "info" });
        }
    }

    injectTabStyles() {
        if (document.getElementById('config-tab-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'config-tab-styles';
        styles.textContent = `
            .config-tab {
                background: transparent;
                border: none;
                padding: 12px 24px;
                color: var(--text-muted);
                font-weight: 500;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
            }
            
            .config-tab:hover {
                color: var(--text-normal);
                background: var(--background-modifier-hover);
            }
            
            .config-tab.active {
                color: var(--brand-experiment);
                border-bottom-color: var(--brand-experiment);
            }
            
            .prompt-item {
                transition: all 0.2s ease;
            }
            
            .prompt-item:hover {
                border-color: var(--brand-experiment);
            }
        `;
        document.head.appendChild(styles);
    }

    setupKeyboardHandling() {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', handleKeyDown);
                // Remove tab styles when modal closes
                const tabStyles = document.getElementById('config-tab-styles');
                if (tabStyles) tabStyles.remove();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
    }

    saveConfiguration() {
        const config = {
            aiOptions: {
                model: this.modal.querySelector('#config-model')?.value || 'gpt-3.5-turbo',
                maxTokens: parseInt(this.modal.querySelector('#config-max-tokens')?.value || 500),
                temperature: parseFloat(this.modal.querySelector('#config-temperature')?.value || 0.7)
            },
            prompts: {},
            customPrompts: {}
        };

        if (this.currentTab === 'ai-options') {
            // Save AI options
            this.configManager.updateConfig(config);
        } else if (this.currentTab === 'prompts') {
            // Save all prompts
            const currentConfig = this.configManager.getConfig();
            config.prompts = currentConfig.prompts;
            
            // Update custom prompts
            this.modal.querySelectorAll('.prompt-item').forEach(item => {
                const promptId = item.dataset.promptId;
                const nameInput = item.querySelector('.prompt-name');
                const textArea = item.querySelector('.prompt-text');
                
                if (nameInput && textArea && promptId.startsWith('custom_')) {
                    const name = nameInput.value.trim();
                    const prompt = textArea.value.trim();
                    
                    if (name && prompt) {
                        config.customPrompts[promptId] = { name, prompt };
                    }
                } else if (textArea && !promptId.startsWith('custom_')) {
                    // Update built-in prompts
                    config.prompts[promptId] = textArea.value.trim();
                }
            });
            
            this.configManager.updateConfig(config);
        }

        this.onSave();
        this.close();
        
        // Remove tab styles
        const tabStyles = document.getElementById('config-tab-styles');
        if (tabStyles) tabStyles.remove();
        
        BdApi.showToast("Configuration saved successfully! ⚙️", { type: "success" });
    }

    resetConfiguration() {
        this.configManager.resetToDefaults();
        this.onSave();
        this.close();
        
        // Remove tab styles
        const tabStyles = document.getElementById('config-tab-styles');
        if (tabStyles) tabStyles.remove();
        
        BdApi.showToast("Configuration reset to defaults! 🔄", { type: "info" });
    }
}

module.exports = ConfigModal;