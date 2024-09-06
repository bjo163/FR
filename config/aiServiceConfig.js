import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
export const MODEL_NAME = "gemini-1.5-flash";
export const API_KEY = "AIzaSyCQGem2-sBVKv3tv0cAq5VQi6Z0EuMbi6s";
export const GENERATION_CONFIG = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2000
};
export const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful and informative AI assistant.";


export const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    }, 
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE
    }, 
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    }, 
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    }
];