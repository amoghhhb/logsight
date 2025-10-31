// File Location: Website/api/summarize.js

import OpenAI from 'openai';

// Initialize the OpenAI client. 
// It automatically looks for the OPENAI_API_KEY environment variable set in Vercel.
const openai = new OpenAI({});

export default async function handler(request, response) {
    // 1. Method Check
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Extract Data from Frontend
    const { systemPrompt, userQuery } = request.body;

    // 3. Environment Check (Double-check that the key is set)
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: OpenAI service key missing.');
    }

    // 4. API Call Configuration
    const model = 'gpt-3.5-turbo'; // Highly reliable and cost-effective model

    try {
        // 5. Execute API Call
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            temperature: 0.1, // Low temperature for factual, consistent summarization
        });

        const aiResponseText = completion.choices[0]?.message?.content?.trim();

        if (aiResponseText) {
            // 6. Success: Send the AI response back to the frontend
            response.status(200).send(aiResponseText);
        } else {
            // Handle valid API response with no content
            response.status(500).send('The AI returned an empty or invalid response.');
        }

    } catch (error) {
        // 7. Error Handling (for API or network errors)
        console.error("OpenAI API Call Error:", error);
        
        // Pass a user-friendly error message
        const errorMessage = error.message || 'An unknown error occurred during the AI request.';
        
        // Return a 400 status to the frontend for API-related issues
        response.status(400).send(`AI Service Error: ${errorMessage}`);
    }
}
