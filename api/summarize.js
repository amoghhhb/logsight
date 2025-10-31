// File Location: api/summarize.js

import OpenAI from 'openai';

// NOTE: This requires the 'openai' package to be installed and Vercel to find it.
// It also requires the OPENAI_API_KEY environment variable.

const openai = new OpenAI({});

export default async function handler(request, response) {
    // 1. Method Check
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Get Data
    const { systemPrompt, userQuery } = request.body;

    // 3. Environment Check
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: OpenAI service key missing.');
    }

    const model = 'gpt-3.5-turbo'; // Low-cost, high-performance model

    try {
        // 4. Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            temperature: 0.1, 
        });

        const aiResponseText = completion.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 5. Send response
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty response.');
        }

    } catch (error) {
        console.error("OpenAI API Call Error:", error);
        
        // This is where the 429 quota error will be caught if your billing is not fixed.
        const errorMessage = error.message || 'An unknown error occurred during the AI request.';
        response.status(400).send(`AI Service Error: ${errorMessage}`);
    }
}
