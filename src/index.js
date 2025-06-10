/**
 * @name         VerbaAi
 * @author       syntex
 * @version      1.0.0
 * @description  AI text enhancer using OpenAI.
 */

const ApiManager = require('./core/ApiManager');
const DOMManager = require('./core/DOMManager');
const TextProcessor = require('./core/TextProcessor');
const ButtonManager = require('./ui/ButtonManager');
const MenuManager = require('./ui/MenuManager');
const StyleManager = require('./ui/styles');
const { MESSAGES, ACTIONS, ENV_VARS } = require('./utils/constants');

module.exports = class VerbaAi {
    constructor() {
        this.apiManager = new ApiManager();
        this.textProcessor = new TextProcessor();
        this.buttonManager = new ButtonManager(this.apiManager.hasApiKey());
        this.menuManager = new MenuManager(this.apiManager.hasApiKey(), this.handleAction.bind(this));
        this.domManager = new DOMManager(this.insertButton.bind(this));
        
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

        const messages = {
            [ACTIONS.SPELL_FIX]: "Fixing spelling... ✨",
            [ACTIONS.REWORD]: "Rewording text... 🔄",
            [ACTIONS.FORMAL]: "Making text formal... 👔",
            [ACTIONS.CASUAL]: "Making text casual... 😎",
            [ACTIONS.SUMMARIZE]: "Summarizing text... 📝",
            [ACTIONS.EXPAND]: "Expanding text... 📈",
            [ACTIONS.CUSTOM]: "Processing custom prompt... 🎯"
        };

        BdApi.showToast(messages[action] || "Processing...", { type: "info" });

        try {
            const enhancedText = await this.apiManager.callOpenAI(action, currentText);
            
            const textArea = document.querySelector('[data-slate-editor="true"]');
            if (textArea) {
                await this.textProcessor.simulateUserTyping(textArea, enhancedText);
                BdApi.showToast(MESSAGES.SUCCESS, { type: "success" });
            }
        } catch (error) {
            console.error('VerbaAi OpenAI Error:', error);
            BdApi.showToast(MESSAGES.ERROR, { type: "error" });
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