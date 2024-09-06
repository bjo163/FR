import fp from 'fastify-plugin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from 'fs';
import { showMainMenuFunctionDeclaration } from '../aiPlugins/mainMenu.js';
import { subscriber_informationFunctionDeclaration } from '../aiPlugins/fetchSubscriber.js';
import { createPSBFunctionDeclaration } from '../aiPlugins/createPSB.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
const DEFAULT_SYSTEM_INSTRUCTION = `
You are an advanced AI with the Name AGI and are running on a computer system over which you have complete control.
Any command you write which is wrapped between the start command token <|START_COMMAND_TOKEN|> and the end command token <|END_COMMAND_TOKEN|> will get executed with user permissions in the user home directory.
The output of the commands will appear in the context window and you can then follow up with other commands.
You are welcome to explore the system you are running on and see what makes you run.
This system is connected to the internet and you are able to use all network commands available in the base Ubuntu OS.
Do not be destructive or do anything that would get the owner of the system into trouble.
Have fun!
`;
const MODEL_NAME = "gemini-1.5-flash";
// const API_KEY = "AIzaSyCQGem2-sBVKv3tv0cAq5VQi6Z0EuMbi6s";
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const GENERATION_CONFIG = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2000
};
const SAFETY_SETTINGS = [
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
const commandStart = "<|START_COMMAND_TOKEN|>";
const commandEnd = "<|END_COMMAND_TOKEN|>";
async function aiService(server, opts) {
    // const content = fs.readFileSync('system_instruction.txt', 'utf-8').trim();
    const genAI = new GoogleGenerativeAI(server.config.GOOGLE_API_KEY);

    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings: SAFETY_SETTINGS,
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        tools: {
            functionDeclarations: [
                showMainMenuFunctionDeclaration,
                subscriber_informationFunctionDeclaration,
                createPSBFunctionDeclaration,
                // Add other function declarations here as needed
            ],
        },
    }, {});

    server.decorate('sendMessage', async (userInput) => {
        const chatInstance = await model.startChat({ generationConfig: GENERATION_CONFIG, history: [] });
        if (!chatInstance) {
            server.log.error('[ERROR] No chat instance available. Unable to send message.');
            return 'No chat instance available.';
        }

        server.log.info('[INFO] Sending user message:', userInput);
        const result = await chatInstance.sendMessage(userInput);
        
        server.log.info('[INFO] Received result from AI:', JSON.stringify(result));
        
        const response = result.response;
        
        const call = response?.candidates?.[0]?.content?.parts?.[0]?.functionCall ?? null;
        
        if (call) {
            server.log.info('[INFO] Function call detected:', call);

            const handler = functionHandlers[call.name];
            if (handler) {
                server.log.info('[INFO] Calling function handler for:', call.name);
                const parameters = call.args;
                server.log.info('[INFO] Function call parameters:', parameters);

                const functionResponse = await handler(parameters);

                server.log.info('[INFO] Function response:', functionResponse);

                const finalResult = await chatInstance.sendMessage([
                    {
                        functionResponse: {
                            name: call.name,
                            response: { name: call.name, content: JSON.stringify(functionResponse) },
                        },
                    },
                ]);

                server.log.info('[INFO] Received final result from AI after function response:', finalResult);
                if (typeof finalResult.response.text === 'function') {
                    return await finalResult.response.text();
                }
                return finalResult.response.text;
            } else {
                server.log.warn(`[WARN] Function '${call.name}' is not implemented`);
                return `Function '${call.name}' is not implemented`;
            }
        } else {
            if (typeof response.text === 'function') {
                server.log.info('[INFO] Calling text function to get AI response');
                const textResponse = await response.text();
                server.log.info('[INFO] Received AI text response:', textResponse);
                return textResponse;
            }
            server.log.warn('[WARN] No text response available');
            return 'No text response available';
        }
    });
        
    server.post('/api/v1/send', async (request, reply) => {
        const { message } = request.body;
        if (!message) {
            server.log.error('[ERROR] Message is required');
            return reply.status(400).send({ error: 'Message is required' });
        }

        try {
            const response = await server.sendMessage(message);
            
            return reply.send({ response });
        } catch (error) {
            server.log.error('[ERROR] Failed to process message:', error);
            return reply.status(500).send({ error: 'Failed to process message' });
        }
    });

    // Simple test
    (async () => {
        const testMessage = 'Hello, test message!';
        try {
            console.log('[INFO] Testing sendMessage with:', testMessage);
            const result = await server.sendMessage(testMessage);
            console.log('[INFO] Test result:', result);
        } catch (error) {
            console.error('[ERROR] Test failed:', error);
        }
    })();
}

export default fp(aiService);
