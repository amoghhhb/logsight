// File Location: Website/api/summarize.js

import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client. It automatically looks for the 
// GEMINI_API_KEY environment variable set in Vercel.
const ai = new GoogleGenAI({}); 

export default async function handler(request, response) {
    // 1. Method Check
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 2. Extract Data
    const { systemPrompt, userQuery } = request.body;

    // 3. Environment Check (Crucial for Vercel secrets)
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY environment variable is not set.");
        return response.status(500).send('Server configuration error: Gemini service key missing.');
    }

    // 4. Model Selection (Free and fast model)
    const model = 'gemini-2.5-flash'; 

    try {
        // 5. Execute API Call
        const geminiResponse = await ai.models.generateContent({
            model: model,
            contents: [
                // Gemini separates the user query from the system instruction (context)
                { role: "user", parts: [{ text: userQuery }] }
            ],
            config: {
                systemInstruction: systemPrompt, // Sets the expert role for the AI
                temperature: 0.1, // Low temperature for factual summarization
            }
        });

        const aiResponseText = geminiResponse.text.trim();

        if (aiResponseText) {
            // 6. Success: Send the AI response back to the frontend
            response.status(200).send(aiResponseText);
        } else {
            response.status(500).send('The AI returned an empty response.');
        }

    } catch (error) {
        // 7. Error Handling
        console.error("Gemini API Call Error:", error);
        
        const errorMessage = error.message || 'An unknown error occurred during the AI request.';
        response.status(400).send(`AI Service Error: ${errorMessage}`);
    }
}