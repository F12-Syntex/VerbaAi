const { STYLES_ID } = require('../utils/constants');

class StyleManager {
    static inject() {
        if (document.getElementById(STYLES_ID)) {
            return; // Already injected
        }

        const styleSheet = document.createElement('style');
        styleSheet.id = STYLES_ID;
        styleSheet.textContent = StyleManager.getCSS();
        document.head.appendChild(styleSheet);
    }

    static remove() {
        const styleSheet = document.getElementById(STYLES_ID);
        if (styleSheet && styleSheet.parentNode) {
            styleSheet.parentNode.removeChild(styleSheet);
        }
    }

    static getCSS() {
        return `
            @keyframes menuSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .verba-ai-menu-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: var(--interactive-normal);
                transition: all 0.1s ease;
                gap: 8px;
                white-space: nowrap;
            }
            
            .verba-ai-menu-item:hover {
                background: var(--background-modifier-hover);
                color: var(--interactive-hover);
            }
            
            .verba-ai-menu-item:active {
                background: var(--background-modifier-selected);
                color: var(--interactive-active);
            }
            
            .verba-ai-menu-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .verba-ai-menu-item.disabled:hover {
                background: transparent;
                color: var(--interactive-normal);
            }
            
            .verba-ai-menu-separator {
                height: 1px;
                background: var(--background-modifier-accent);
                margin: 4px 0;
            }
            
            #verba-ai-menu {
                max-height: min(300px, calc(100vh - 100px));
            }
            
            #verba-ai-menu::-webkit-scrollbar {
                width: 8px;
            }
            
            #verba-ai-menu::-webkit-scrollbar-track {
                background: transparent;
            }
            
            #verba-ai-menu::-webkit-scrollbar-thumb {
                background: var(--scrollbar-auto-thumb);
                border-radius: 4px;
            }
            
            #verba-ai-menu::-webkit-scrollbar-thumb:hover {
                background: var(--scrollbar-auto-thumb-hover);
            }
        `;
    }
}

module.exports = StyleManager;