module.exports = {
    API_ENDPOINTS: {
        OPENAI: 'https://api.openai.com/v1/chat/completions'
    },
    
    ENV_VARS: [
        'OPENAI_API_KEY',
        'VERBA_AI_API_KEY',
        'AI_API_KEY'
    ],
    
    BUTTON_ID: 'verba-ai-button',
    CONTAINER_ID: 'verba-ai-container',
    MENU_ID: 'verba-ai-menu',
    STYLES_ID: 'verba-ai-styles',
    CONFIG_MODAL_ID: 'verba-ai-config-modal',
    CONFIG_STORAGE_KEY: 'verba-ai-config',
    
    TIMINGS: {
        INSERTION_DEBOUNCE: 500,
        ROUTE_CHECK_INTERVAL: 1000,
        CHANNEL_CHANGE_DELAY: 1000,
        KEY_PRESS_DELAY: 5,
        TYPING_DELAY: 5,
        FOCUS_DELAY: 50,
        CLEAR_DELAY: 100
    },
    
    ACTIONS: {
        SPELL_FIX: 'spell-fix',
        REWORD: 'reword',
        FORMAL: 'formal',
        CASUAL: 'casual',
        SUMMARIZE: 'summarize',
        EXPAND: 'expand',
        CUSTOM: 'custom'
    },
    
    CONFIG_DEFAULTS: {
        aiOptions: {
            model: 'gpt-3.5-turbo',
            maxTokens: 500,
            temperature: 0.7
        },
        prompts: {
            'spell-fix': "Fix any spelling and grammar errors in the following text. Return only the corrected text:",
            'reword': "Rewrite the following text to improve clarity and flow while maintaining the same meaning:",
            'formal': "Rewrite the following text in a formal, professional tone:",
            'casual': "Rewrite the following text in a casual, friendly tone:",
            'summarize': "Summarize the following text concisely:",
            'expand': "Expand on the following text with more detail and explanation:",
            'custom': "Improve the following text:"
        },
        customPrompts: {}
    },
    
    MESSAGES: {
        START_SUCCESS: "VerbaAi has started! ✨",
        START_WARNING: "VerbaAi started - Please set OPENAI_API_KEY in environment variables",
        STOP: "VerbaAi has stopped!",
        NO_API_KEY: "OpenAI API key required! Set OPENAI_API_KEY environment variable.",
        NO_TEXT_INPUT: "Could not find text input!",
        NO_TEXT: "No text to enhance!",
        SUCCESS: "Text enhanced successfully! 🎉",
        ERROR: "Enhancement failed. Check console for details."
    }
};