// File Location: Website/api/summarize.js
// This code runs on the Vercel server and securely uses your OPENROUTER_API_KEY.

export default async function handler(request, response) {
    // 1. Enforce POST requests
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get the prompts from the frontend request (from ai.html)
    const { systemPrompt, userQuery } = request.body;

    // 3. SECURELY retrieve the API key from Vercel's Environment Variables
    const apiKey = process.env.OPENROUTER_API_KEY; 
    
    if (!apiKey) {
        console.error("OPENROUTER_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: AI service key missing.');
    }

    // 4. Prepare the payload for OpenRouter
    const openRouterPayload = {
        
        // CRITICAL FIX: The 'model' field MUST be a single string for the primary model.
        // We set the highest priority model as the single string.
        model: "deepseek/deepseek-r1:free", 
        
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        
        // The list of fallbacks and headers are wrapped inside 'extra_body'
        // This is the correct way to pass multiple models for fallback/routing on OpenRouter.
        extra_body: {
            "models": [ // OpenRouter will try these in order if the primary model fails
                "deepseek/deepseek-r1:free", 
                "meta-llama/llama-3-8b-instruct:free", 
                "mistralai/mistral-7b-instruct:free"
            ],
            // Recommended OpenRouter headers for site attribution
            "X-Title": "LogSight AI Summarizer",
            "HTTP-Referer": "https://logsight.vercel.app" 
        }
    };

    // 5. Call the OpenRouter API using the secret key
    try {
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // OpenRouter uses the Bearer token standard
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify(openRouterPayload)
        });

        if (!openRouterResponse.ok) {
            const errorBody = await openRouterResponse.json();
            console.error("OpenRouter API Error:", errorBody);
            
            // Pass a concise error message from the API back to the frontend
            const errorMessage = errorBody.error && errorBody.error.message ? errorBody.error.message : 'Error from AI provider.';
            return response.status(openRouterResponse.status).send(errorMessage);
        }

        const result = await openRouterResponse.json();
        
        if (result.choices && result.choices[0].message && result.choices[0].message.content) {
            // 6. Send the AI's text response *back* to your frontend (ai.html)
            response.status(200).send(result.choices[0].message.content);
        } else {
            response.status(500).send('Invalid response structure from AI.');
        }

    } catch (error) {
        console.error("Internal Server Error:", error);
        response.status(500).send('Error processing your request on the server.');
    }
}
