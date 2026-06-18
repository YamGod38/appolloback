const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
});

/**
 * AI Copilot - Agent Assist
 * Receives live transcript chunks from the frontend and returns suggested responses.
 */
exports.generateSuggestion = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        console.log(`[AI Copilot] Processing transcript: "${transcript.substring(0, 50)}..."`);

        // Check for mock fallback if no real API key is present
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
            console.log('[AI Copilot] MOCK MODE ACTIVE. Generating simulated response...');
            
            // Simple mock logic based on keywords
            let suggestion = "I understand. Let me help you with that right away.";
            if (transcript.toLowerCase().includes('book') || transcript.toLowerCase().includes('appointment')) {
                suggestion = "I can certainly help you book that appointment. Which doctor or department are you looking for?";
            } else if (transcript.toLowerCase().includes('pressure') || transcript.toLowerCase().includes('pain')) {
                suggestion = "I'm sorry to hear you're experiencing this. Let me pull up your medical history and connect you with a physician immediately.";
            }

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            return res.json({ suggestion });
        }

        // Production OpenAI call
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are an AI assistant helping a call center agent. Provide a single, concise, professional 1-2 sentence response the agent can read to the customer based on the ongoing transcript.' },
                { role: 'user', content: `Customer says: ${transcript}` }
            ],
            temperature: 0.7,
            max_tokens: 100
        });

        res.json({ suggestion: response.choices[0].message.content });

    } catch (error) {
        console.error('[AI Copilot] Error generating suggestion:', error.message);
        res.status(500).json({ error: 'Failed to generate AI suggestion.' });
    }
};
