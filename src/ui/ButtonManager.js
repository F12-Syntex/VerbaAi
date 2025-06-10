const { BUTTON_ID, CONTAINER_ID } = require('../utils/constants');

class ButtonManager {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.buttonContainer = null;
        this.button = null;
    }

    create() {
        this.buttonContainer = document.createElement("div");
        this.buttonContainer.id = CONTAINER_ID;
        this.buttonContainer.style.position = "relative";

        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.setAttribute("aria-label", "VerbaAi - Enhance your text");
        this.button.id = BUTTON_ID;

        const contents = document.createElement("div");
        const buttonWrapper = document.createElement("div");
        buttonWrapper.style.cssText = "opacity: 1; transform: none;";

        const iconContainer = document.createElement("div");
        iconContainer.style.cssText = "display: flex; width: 20px; height: 20px; color: var(--interactive-normal); transition: color 0.2s ease;";

        const iconColor = this.apiKey ? "currentColor" : "#ff6b6b";
        iconContainer.innerHTML = this._getIconSVG(iconColor);

        buttonWrapper.appendChild(iconContainer);
        contents.appendChild(buttonWrapper);
        this.button.appendChild(contents);
        this.buttonContainer.appendChild(this.button);

        this._copyDiscordButtonStyles();
        this._addHoverEffects(iconContainer);

        return this.buttonContainer;
    }

    addEventListener(event, handler) {
        if (this.button) {
            this.button.addEventListener(event, handler);
        }
    }

    setActiveState(isActive) {
        const iconContainer = this.button?.querySelector('div > div > div');
        if (iconContainer) {
            iconContainer.style.color = isActive ? 
                "var(--interactive-active)" : 
                "var(--interactive-normal)";
        }
    }

    remove() {
        if (this.buttonContainer && this.buttonContainer.parentNode) {
            this.buttonContainer.parentNode.removeChild(this.buttonContainer);
        }
    }

    _getIconSVG(color) {
        return `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${color}">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" opacity="0.8"/>
                <path d="M19 4L20.18 7.82L24 9L20.18 10.18L19 14L17.82 10.18L14 9L17.82 7.82L19 4Z" opacity="0.6"/>
                <path d="M5 2L5.91 5.09L9 6L5.91 6.91L5 10L4.09 6.91L1 6L4.09 5.09L5 2Z" opacity="0.4"/>
            </svg>
        `;
    }

    _copyDiscordButtonStyles() {
        const existingButton = document.querySelector('[aria-label="Select emoji"], [aria-label="Open GIF picker"], [aria-label="Apps"]');
        
        if (existingButton) {
            this.buttonContainer.className = existingButton.parentElement.className;
            this.button.className = existingButton.className;
            
            const existingContents = existingButton.querySelector('[class*="contents"]');
            if (existingContents) {
                this.button.querySelector('div').className = existingContents.className;
            }
            
            const existingWrapper = existingButton.querySelector('[class*="buttonWrapper"], [class*="wrapper"]');
            if (existingWrapper) {
                const buttonWrapper = this.button.querySelector('div > div');
                buttonWrapper.className = existingWrapper.className;
                buttonWrapper.style.cssText = existingWrapper.style.cssText || "opacity: 1; transform: none;";
            }
            
            const existingIcon = existingButton.querySelector('[class*="lottieIcon"], [class*="icon"]');
            if (existingIcon) {
                const iconContainer = this.button.querySelector('div > div > div');
                iconContainer.className = existingIcon.className;
                iconContainer.style.cssText += "; display: flex; width: 20px; height: 20px; color: var(--interactive-normal); transition: color 0.2s ease;";
            }
        }
    }

    _addHoverEffects(iconContainer) {
        this.button.addEventListener("mouseenter", () => {
            if (!this.isMenuOpen) {
                iconContainer.style.color = "var(--interactive-hover)";
            }
        });

        this.button.addEventListener("mouseleave", () => {
            if (!this.isMenuOpen) {
                iconContainer.style.color = "var(--interactive-normal)";
            }
        });

        this.button.addEventListener("mousedown", () => {
            iconContainer.style.color = "var(--interactive-active)";
        });

        this.button.addEventListener("mouseup", () => {
            if (!this.isMenuOpen) {
                iconContainer.style.color = "var(--interactive-hover)";
            }
        });

        this.button.addEventListener("focus", () => {
            if (!this.isMenuOpen) {
                iconContainer.style.color = "var(--interactive-hover)";
            }
        });

        this.button.addEventListener("blur", () => {
            if (!this.isMenuOpen) {
                iconContainer.style.color = "var(--interactive-normal)";
            }
        });
    }
}

module.exports = ButtonManager;