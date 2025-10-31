// File Location: Website/api/summarize.js
// This code runs on the Vercel server and securely uses your OPENAI_API_KEY.

import OpenAI from 'openai';

// Initialize the OpenAI client using the key from Vercel's environment variables
// The SDK automatically looks for the OPENAI_API_KEY variable.
const openai = new OpenAI({});

export default async function handler(request, response) {
    // 1. Enforce POST requests
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get the prompts from the frontend request (from ai.html)
    const { systemPrompt, userQuery } = request.body;

    // 3. Environment check
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: OpenAI service key missing.');
    }

    // 4. Set the low-cost model
    const model = 'gpt-3.5-turbo';

    try {
        // 5. Call the OpenAI API
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            temperature: 0.1, // Keep it low for factual log summarization
        });

        const aiResponseText = completion.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 6. Send the AI's text response *back* to your frontend (ai.html)
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty or invalid response.');
        }

    } catch (error) {
        // Log the full error for debugging
        console.error("OpenAI API Call Error:", error);
        
        // Return a user-friendly error to the frontend
        const errorMessage = error.message || 'An unknown error occurred during the AI request.';
        
        // Use 400 for client-side issues like invalid requests, or 500 for general server errors
        response.status(400).send(`AI Service Error: ${errorMessage}`);
    }
}
