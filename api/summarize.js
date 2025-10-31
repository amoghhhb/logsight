// File Location: api/summarize.js (No external dependencies used)

export default async function handler(request, response) {
    // 1. Enforce POST requests
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get Data and API Key
    // Vercel's Node runtime supports request.json() to parse the body
    const { systemPrompt, userQuery } = await request.json(); 

    // NOTE: Switched to GROQ_API_KEY
    const apiKey = process.env.GROQ_API_KEY; 

    if (!apiKey) {
        return response.status(500).send('Server error: GROQ_API_KEY not found.');
    }

    // 3. Prepare Payload for Groq (OpenAI-compatible)
    const groqPayload = {
        // Using a fast Llama model hosted by Groq
        model: 'llama-3.1-8b-instant', 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ],
        temperature: 0.1,
    };

    try {
        // 4. Call Groq API using native fetch()
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authorization header uses the Groq API Key
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify(groqPayload)
        });

        // 5. Handle Errors (e.g., 429 Rate Limit from Groq)
        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error("Groq API Error:", errorText);
            return response.status(groqResponse.status).send(`AI Service Error (Llama): ${errorText}`);
        }

        const result = await groqResponse.json();
        
        const aiResponseText = result.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 6. Success: Send the Llama response back
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty response.');
        }

    } catch (error) {
        console.error("Network or Runtime Error:", error);
        response.status(500).send(`Internal Server Error: ${error.message}`);
    }
}
