/**
 * @name         VerbaAi
 * @author       syntex
 * @version      1.0.0
 * @description  AI text enhancer using OpenAI.
 */

const ConfigManager = require('./core/ConfigManager');
const ApiManager = require('./core/ApiManager');
const DOMManager = require('./core/DOMManager');
const TextProcessor = require('./core/TextProcessor');
const ButtonManager = require('./ui/ButtonManager');
const MenuManager = require('./ui/MenuManager');
const ConfigModal = require('./ui/ConfigModal');
const StyleManager = require('./ui/styles');
const SuggestionBox = require('./ui/SuggestionBox'); 
const { MESSAGES, ACTIONS, ENV_VARS } = require('./utils/constants');

module.exports = class VerbaAi {
    constructor() {
        this.configManager = new ConfigManager();
        this.apiManager = new ApiManager(this.configManager);
        this.textProcessor = new TextProcessor();
        this.buttonManager = new ButtonManager(this.apiManager.hasApiKey());
        this.menuManager = new MenuManager(
            this.apiManager.hasApiKey(), 
            this.configManager,
            this.handleAction.bind(this), 
            this.openConfiguration.bind(this)
        );
        this.domManager = new DOMManager(this.insertButton.bind(this));
        this.configModal = new ConfigModal(this.configManager, this.onConfigSave.bind(this));
        this.suggestionBox = new SuggestionBox(this.apiManager, this.configManager); 
        
        this.isMenuOpen = false;
    }

    start() {
        this.domManager.setupObserver();
        this.domManager.setupRouteObserver();
        this.addButton();
        
        if (this.apiManager.hasApiKey()) {
            BdApi.showToast(MESSAGES.START_SUCCESS, { type: "success" });
        } else {
            BdApi.showToast(MESSAGES.START_WARNING, { type: "warning" });
        }
    }

    stop() {
        this.domManager.cleanup();
        this.removeButton();
        this.removeMenu();
        this.configModal.close();
        this.suggestionBox.hide();
        BdApi.showToast(MESSAGES.STOP, { type: "error" });
    }

    addButton() {
        const buttonContainer = this.buttonManager.create();
        
        this.buttonManager.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        document.addEventListener("click", (e) => {
            if (this.isMenuOpen && !buttonContainer.contains(e.target)) {
                this.closeMenu();
            }
        });

        this.insertButton();
    }

    insertButton() {
        const buttonContainer = this.buttonManager.buttonContainer;
        if (buttonContainer) {
            this.domManager.insertButton(buttonContainer);
        }
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.isMenuOpen) return;

        this.isMenuOpen = true;
        this.menuManager.open(this.buttonManager.buttonContainer);
        this.buttonManager.setActiveState(true);
    }

    closeMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;
        this.menuManager.close();
        this.buttonManager.setActiveState(false);
    }

    openConfiguration() {
        this.configModal.open();
    }

    onConfigSave() {
        // Configuration was saved, we might want to refresh API manager
        this.apiManager.loadConfiguration();
    }

     async handleAction(action) {
        if (action === 'api-info') {
            this.showApiKeyInfo();
            return;
        }

        if (!this.apiManager.hasApiKey()) {
            BdApi.showToast(MESSAGES.NO_API_KEY, { type: "error" });
            return;
        }

        const currentText = this.textProcessor.getTextFromInput();
        if (!currentText) {
            BdApi.showToast(MESSAGES.NO_TEXT_INPUT, { type: "error" });
            return;
        }

        if (!currentText.trim()) {
            BdApi.showToast(MESSAGES.NO_TEXT, { type: "warning" });
            return;
        }

        // Close the menu when action is triggered
        this.closeMenu();

        // Show the suggestion box instead of directly processing
        const textArea = document.querySelector('[data-slate-editor="true"]');
        if (textArea) {
            try {
                await this.suggestionBox.show(textArea, action, currentText);
                BdApi.showToast("Generating suggestions... ✨", { type: "info" });
            } catch (error) {
                console.error('VerbaAi Suggestion Error:', error);
                BdApi.showToast(MESSAGES.ERROR, { type: "error" });
            }
        }
    }


    showApiKeyInfo() {
        const apiInfo = this.apiManager.getApiInfo();
        
        const message = apiInfo.hasKey ? 
            '✅ Connected to OpenAI' :
            `❌ No API key found. Set one of these environment variables:\n${ENV_VARS.map(v => `• ${v}`).join('\n')}`;

        BdApi.showToast(message, { 
            type: apiInfo.hasKey ? "success" : "error",
            timeout: 5000
        });

        console.log('VerbaAi API Configuration:', apiInfo);
    }

    removeButton() {
        this.buttonManager.remove();
        StyleManager.remove();
    }

    removeMenu() {
        this.menuManager.close();
    }
};