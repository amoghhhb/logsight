// File Location: api/summarize.js (No external dependencies used)

export default async function handler(request, response) {
    // 1. Enforce POST requests and handle the request body
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }
    
    // Vercel's Node runtime supports request.json() to parse the body
    const { systemPrompt, userQuery } = await request.json(); 

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return response.status(500).send('Server error: OPENAI_API_KEY not found.');
    }

    // 2. Prepare Payload for OpenAI
    const openAiPayload = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        temperature: 0.1,
    };

    try {
        // 3. Call OpenAI API using native fetch()
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authorization is critical
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(openAiPayload)
        });

        // 4. Handle Errors (e.g., 429 Quota Exceeded)
        if (!openAiResponse.ok) {
            const errorText = await openAiResponse.text();
            console.error("OpenAI API Error:", errorText);
            return response.status(openAiResponse.status).send(`AI Service Error: ${errorText}`);
        }

        const result = await openAiResponse.json();
        
        const aiResponseText = result.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 5. Success: Send the AI response back
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty response.');
        }

    } catch (error) {
        console.error("Network or Runtime Error:", error);
        response.status(500).send(`Internal Server Error: ${error.message}`);
    }
}
