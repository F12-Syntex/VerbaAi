const { MENU_ID, ACTIONS } = require('../utils/constants');
const StyleManager = require('./styles');

class MenuManager {
    constructor(apiKey, onActionHandler) {
        this.apiKey = apiKey;
        this.onActionHandler = onActionHandler;
        this.menuElement = null;
        this.isOpen = false;
    }

    toggle(buttonContainer) {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(buttonContainer);
        }
    }

    open(buttonContainer) {
        if (this.isOpen) return;

        this.isOpen = true;
        StyleManager.inject();
        this._createMenu(buttonContainer);
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this._removeMenu();
    }

    _createMenu(buttonContainer) {
        this.menuElement = document.createElement("div");
        this.menuElement.id = MENU_ID;
        
        const buttonRect = buttonContainer.getBoundingClientRect();
        const menuWidth = 180;
        
        const centerLeft = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2);
        const topPosition = buttonRect.top - 8;
        
        const viewportWidth = window.innerWidth;
        const finalLeft = Math.max(8, Math.min(centerLeft, viewportWidth - menuWidth - 8));
        
        this.menuElement.style.cssText = `
            position: fixed;
            bottom: ${window.innerHeight - topPosition}px;
            left: ${finalLeft}px;
            background: var(--background-floating);
            border-radius: 8px;
            box-shadow: var(--elevation-high);
            border: 1px solid var(--background-modifier-accent);
            padding: 6px;
            width: ${menuWidth}px;
            z-index: 10000;
            animation: menuSlideUp 0.1s ease-out;
            max-height: 300px;
            overflow-y: auto;
            transform-origin: bottom center;
        `;

        this._populateMenu();
        document.body.appendChild(this.menuElement);
    }

    _removeMenu() {
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
            this.menuElement = null;
        }
    }

    _populateMenu() {
        const menuOptions = this._getMenuOptions();

        menuOptions.forEach(option => {
            if (option === null) {
                const separator = document.createElement("div");
                separator.className = "verba-ai-menu-separator";
                this.menuElement.appendChild(separator);
            } else {
                const menuItem = document.createElement("div");
                menuItem.className = `verba-ai-menu-item${option.disabled ? ' disabled' : ''}`;
                menuItem.innerHTML = `${option.icon}<span>${option.label}</span>`;
                
                if (!option.disabled) {
                    menuItem.addEventListener("click", (e) => {
                        e.stopPropagation();
                        option.action();
                        this.close();
                    });
                }

                this.menuElement.appendChild(menuItem);
            }
        });
    }

    _getMenuOptions() {
        return [
            {
                icon: this.apiKey ? 
                    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                    </svg>` :
                    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/>
                    </svg>`,
                label: this.apiKey ? "OpenAI Connected" : "API Key Required",
                action: () => this.onActionHandler('api-info'),
                disabled: false
            },
            null,
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z"/>
                </svg>`,
                label: "Fix Spelling",
                action: () => this.onActionHandler(ACTIONS.SPELL_FIX),
                disabled: !this.apiKey
            },
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,17H12V9H10V7H14V17M9,17H7V13H5V11H9V17M16,7H20V9H18V17H16V9H16V7Z"/>
                </svg>`,
                label: "Reword",
                action: () => this.onActionHandler(ACTIONS.REWORD),
                disabled: !this.apiKey
            },
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,4V6H21V4H9M9,14H21V12H9V14M9,10H21V8H9V10M9,20H21V18H9V20M5,4V6.5L6.5,5L5,3.5V4M5,14L6.5,12.5L5,11V14M5,20V16.5L6.5,18L5,19.5V20Z"/>
                </svg>`,
                label: "Make Formal",
                action: () => this.onActionHandler(ACTIONS.FORMAL),
                disabled: !this.apiKey
            },
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A3,3 0 0,1 15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6M12,20C9.5,20 7.29,18.8 6,16.9C7.5,15.6 9.7,15 12,15C14.3,15 16.5,15.6 18,16.9C16.71,18.8 14.5,20 12,20Z"/>
                </svg>`,
                label: "Make Casual",
                action: () => this.onActionHandler(ACTIONS.CASUAL),
                disabled: !this.apiKey
            },
            null,
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,7H15V9H9V7M9,11H13V13H9V11M9,15H15V17H9V15M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4Z"/>
                </svg>`,
                label: "Summarize",
                action: () => this.onActionHandler(ACTIONS.SUMMARIZE),
                disabled: !this.apiKey
            },
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M5,8V12H11V8H5M13,8V12H19V8H13M5,14V18H11V14H5M13,14V18H19V14H13Z"/>
                </svg>`,
                label: "Expand",
                action: () => this.onActionHandler(ACTIONS.EXPAND),
                disabled: !this.apiKey
            },
            null,
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>`,
                label: "Custom Prompt",
                action: () => this.onActionHandler(ACTIONS.CUSTOM),
                disabled: !this.apiKey
            }
        ];
    }
}

module.exports = MenuManager;