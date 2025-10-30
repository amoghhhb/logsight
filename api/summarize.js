// File Location: Website/api/summarize.js
// This code runs on the Vercel server and securely uses your DEEPSEEK_API_KEY.

export default async function handler(request, response) {
    // 1. Enforce POST requests
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get the prompts from the frontend request (from ai.html)
    const { systemPrompt, userQuery } = request.body;

    // 3. SECURELY retrieve the API key from Vercel's Environment Variables
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error("DEEPSEEK_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: AI service key missing.');
    }

    // 4. Prepare the payload for DeepSeek
    const deepSeekPayload = {
        model: "deepseek-chat", // DeepSeek model identifier
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ]
    };

    // 5. Call the real DeepSeek API using the secret key
    try {
        const deepSeekResponse = await fetch("https://api.deepseek.com/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // This Authorization header is the only place the API key is used
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify(deepSeekPayload)
        });

        if (!deepSeekResponse.ok) {
            const errorBody = await deepSeekResponse.text();
            console.error("DeepSeek API Error:", errorBody);
            // Pass the error status/message back to your frontend
            return response.status(deepSeekResponse.status).send('Error from AI provider. Check Vercel logs for API key or usage issues.');
        }

        const result = await deepSeekResponse.json();
        
        if (result.choices && result.choices[0].message && result.choices[0].message.content) {
            // 6. Send the AI's text response *back* to your frontend (ai.html)
            response.status(200).send(result.choices[0].message.content);
        } else {
            response.status(500).send('Invalid response structure from AI');
        }

    } catch (error) {
        console.error("Internal Server Error:", error);
        response.status(500).send('Error processing your request on the server.');
    }
}