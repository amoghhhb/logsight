// File Location: api/summarize.js

// NOTE: This file uses native Node.js 'fetch' and does NOT require package.json.

export default async function handler(request, response) {
    // 1. Enforce POST requests
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get Data and API Key
    const { systemPrompt, userQuery } = await request.json(); // Use request.json() to parse body

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return response.status(500).send('Server configuration error: OPENAI_API_KEY is missing.');
    }

    // 3. Prepare Payload for OpenAI
    const openAiPayload = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        temperature: 0.1,
    };

    try {
        // 4. Call OpenAI API using native fetch()
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authorization is the most critical part
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(openAiPayload)
        });

        // 5. Handle Errors (e.g., 401, 429) from OpenAI
        if (!openAiResponse.ok) {
            const errorText = await openAiResponse.text();
            console.error("OpenAI API Error:", errorText);
            return response.status(openAiResponse.status).send(`AI Service Error: ${errorText}`);
        }

        const result = await openAiResponse.json();
        
        const aiResponseText = result.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 6. Success: Send the AI response back
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty response.');
        }

    } catch (error) {
        console.error("Network Error:", error);
        response.status(500).send(`Internal Server Error: ${error.message}`);
    }
}
