const { BUTTON_ID, TIMINGS } = require('../utils/constants');

class DOMManager {
    constructor(insertButtonCallback) {
        this.insertButtonCallback = insertButtonCallback;
        this.domObserver = null;
        this.insertionTimeout = null;
        this.routeCheckInterval = null;
    }

    setupObserver() {
        if (this.domObserver) {
            this.domObserver.disconnect();
        }

        this.domObserver = new MutationObserver((mutations) => {
            if (!document.getElementById(BUTTON_ID)) {
                clearTimeout(this.insertionTimeout);
                this.insertionTimeout = setTimeout(() => {
                    this.insertButtonCallback();
                }, TIMINGS.INSERTION_DEBOUNCE);
            }
        });

        const appContainer = document.querySelector('#app-mount') || document.body;
        this.domObserver.observe(appContainer, {
            childList: true,
            subtree: true
        });
    }

    setupRouteObserver() {
        let currentPath = window.location.pathname;
        
        const checkForRouteChange = () => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                setTimeout(() => {
                    if (!document.getElementById(BUTTON_ID)) {
                        this.insertButtonCallback();
                    }
                }, TIMINGS.CHANNEL_CHANGE_DELAY);
            }
        };

        this.routeCheckInterval = setInterval(checkForRouteChange, TIMINGS.ROUTE_CHECK_INTERVAL);
    }

    findToolbar() {
        return document.querySelector('[class*="buttons-"]') ||
               document.querySelector('form[class*="form-"] [class*="buttons-"]') ||
               document.querySelector('[data-slate-editor="true"]')?.closest('div')?.querySelector('[class*="buttons-"]') ||
               document.querySelector('[aria-label="Select emoji"], [aria-label="Open GIF picker"]')?.parentElement;
    }

    insertButton(buttonContainer) {
        if (document.getElementById(BUTTON_ID)) {
            return false;
        }

        const toolbar = this.findToolbar();
        if (toolbar) {
            if (toolbar.firstChild) {
                toolbar.insertBefore(buttonContainer, toolbar.firstChild);
            } else {
                toolbar.appendChild(buttonContainer);
            }
            console.log("VerbaAi button added successfully");
            return true;
        } else {
            console.log("VerbaAi: Toolbar not found, waiting for DOM changes...");
            return false;
        }
    }

    cleanup() {
        if (this.domObserver) {
            this.domObserver.disconnect();
            this.domObserver = null;
        }
        
        if (this.routeCheckInterval) {
            clearInterval(this.routeCheckInterval);
            this.routeCheckInterval = null;
        }
        
        if (this.insertionTimeout) {
            clearTimeout(this.insertionTimeout);
            this.insertionTimeout = null;
        }
    }
}

module.exports = DOMManager;