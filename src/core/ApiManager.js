const { API_ENDPOINTS, ENV_VARS } = require('../utils/constants');

class ApiManager {
    constructor() {
        this.apiKey = null;
        this.apiEndpoint = API_ENDPOINTS.OPENAI;
        this.loadConfiguration();
    }

    loadConfiguration() {
        // Get OpenAI API key from environment variables
        this.apiKey = ENV_VARS.reduce((key, envVar) => 
            key || process.env[envVar], null);

        // Allow custom endpoint override
        if (process.env.VERBA_AI_ENDPOINT) {
            this.apiEndpoint = process.env.VERBA_AI_ENDPOINT;
        }

        console.log('VerbaAi: Using OpenAI provider', this.apiKey ? '✓ API Key found' : '✗ No API Key');
    }

    hasApiKey() {
        return !!this.apiKey;
    }

    getApiInfo() {
        return {
            provider: 'openai',
            endpoint: this.apiEndpoint,
            hasKey: this.hasApiKey(),
            supportedEnvVars: ENV_VARS
        };
    }

    async callOpenAI(action, text) {
        if (!this.apiKey) {
            throw new Error('No API key available');
        }

        const prompts = {
            "spell-fix": "Fix any spelling and grammar errors in the following text. Return only the corrected text:",
            "reword": "Rewrite the following text to improve clarity and flow while maintaining the same meaning:",
            "formal": "Rewrite the following text in a formal, professional tone:",
            "casual": "Rewrite the following text in a casual, friendly tone:",
            "summarize": "Summarize the following text concisely:",
            "expand": "Expand on the following text with more detail and explanation:",
            "custom": "Improve the following text:"
        };

        const fullPrompt = `${prompts[action]}\n\n"${text}"`;
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: fullPrompt }],
                max_tokens: 500
            })
        };
        
        const response = await fetch(this.apiEndpoint, requestOptions);
        
        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || '';
    }
}

module.exports = ApiManager;