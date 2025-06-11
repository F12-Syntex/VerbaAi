const { API_ENDPOINTS, ENV_VARS } = require('../utils/constants');

class ApiManager {
    constructor(configManager) {
        this.configManager = configManager;
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

        console.log('VerbaAi: Using OpenAI provider', this.apiKey ? '✅ API Key found' : '❌ No API Key');
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

        const config = this.configManager.getConfig();
        const prompt = this.configManager.getPrompt(action);
        const fullPrompt = `${prompt}\n\n"${text}"`;
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: config.aiOptions.model,
                messages: [{ role: 'user', content: fullPrompt }],
                max_tokens: config.aiOptions.maxTokens,
                temperature: config.aiOptions.temperature
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