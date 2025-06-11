const { CONFIG_DEFAULTS, CONFIG_STORAGE_KEY } = require('../utils/constants');

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (stored) {
                const parsedConfig = JSON.parse(stored);
                // Merge with defaults to ensure all properties exist
                return { 
                    ...CONFIG_DEFAULTS, 
                    ...parsedConfig,
                    // Ensure customPrompts exists
                    customPrompts: parsedConfig.customPrompts || {}
                };
            }
        } catch (error) {
            console.log('VerbaAi: Error loading config, using defaults:', error);
        }
        return { ...CONFIG_DEFAULTS };
    }

    saveConfig() {
        try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
            console.log('VerbaAi: Configuration saved');
        } catch (error) {
            console.error('VerbaAi: Error saving config:', error);
        }
    }

    getConfig() {
        return { ...this.config };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    resetToDefaults() {
        this.config = { ...CONFIG_DEFAULTS };
        this.saveConfig();
    }

    getPrompt(action) {
        // Check custom prompts first, then built-in prompts, then default
        return this.config.customPrompts[action] || 
               this.config.prompts[action] || 
               CONFIG_DEFAULTS.prompts[action] || 
               "Improve the following text:";
    }

    getAiOptions() {
        return this.config.aiOptions;
    }

    addCustomPrompt(id, name, prompt) {
        if (!this.config.customPrompts) {
            this.config.customPrompts = {};
        }
        this.config.customPrompts[id] = { name, prompt };
        this.saveConfig();
    }

    removeCustomPrompt(id) {
        if (this.config.customPrompts && this.config.customPrompts[id]) {
            delete this.config.customPrompts[id];
            this.saveConfig();
        }
    }

    updateCustomPrompt(id, name, prompt) {
        if (this.config.customPrompts && this.config.customPrompts[id]) {
            this.config.customPrompts[id] = { name, prompt };
            this.saveConfig();
        }
    }

    getCustomPrompts() {
        return this.config.customPrompts || {};
    }

    getAllPrompts() {
        const builtIn = Object.keys(this.config.prompts).map(key => ({
            id: key,
            name: this.getPromptDisplayName(key),
            prompt: this.config.prompts[key],
            isBuiltIn: true
        }));

        const custom = Object.entries(this.getCustomPrompts()).map(([id, data]) => ({
            id,
            name: data.name,
            prompt: data.prompt,
            isBuiltIn: false
        }));

        return [...builtIn, ...custom];
    }

    getPromptDisplayName(action) {
        const displayNames = {
            'spell-fix': 'Fix Spelling',
            'reword': 'Reword',
            'formal': 'Make Formal',
            'casual': 'Make Casual',
            'summarize': 'Summarize',
            'expand': 'Expand',
            'custom': 'Custom'
        };
        return displayNames[action] || action;
    }
}

module.exports = ConfigManager;