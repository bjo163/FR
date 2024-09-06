import fp from 'fastify-plugin';
import { GoogleGenerativeAI} from "@google/generative-ai";
import fs from 'fs';
import moment from 'moment-timezone';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { API_KEY,SAFETY_SETTINGS } from '../config/aiServiceConfig.js';
import { showMainMenu,showMainMenuFunctionDeclaration } from '../aiPlugins/mainMenu.js';
import { execute_command,execute_command_tool } from '../aiPlugins/bashShell.js';
import { odoo_crud_operations,odooCrudFunctionDeclaration } from '../aiPlugins/odooCrudOperations.js';
import { subscriber_information,subscriber_informationFunctionDeclaration } from '../aiPlugins/fetchSubscriber.js';
import { createPSB,createPSBFunctionDeclaration } from '../aiPlugins/createPSB.js';
import { search_or_scrape,search_or_scrapeFunctionDeclaration } from '../aiPlugins/googleSearch.js';

import { autonomous_project_management, autonomous_project_management_tool } from '../aiPlugins/autonomous_project_management.js'; // Import here
import { getMemory, saveMemory } from '../aiPlugins/memory.js';
import os from 'os';
// Nama endpoint yang baru
const ENDPOINT = '/api/v1/agents'

const getOSAndWorldInfo = () => {
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();
    const hostname = os.hostname();
    const localTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const timeZone = moment.tz.guess();

    return {
        platform,
        release,
        arch,
        hostname,
        localTime,
        timeZone,
    };
};

// Function to get plugin uptime
const getUptime = (startTime) => {
    const currentTime = moment();
    const uptime = moment.duration(currentTime.diff(startTime));
    return {
        uptime: `${uptime.days()} days, ${uptime.hours()} hours, ${uptime.minutes()} minutes, ${uptime.seconds()} seconds`
    };
};
const functionHandlers = {
    menu: showMainMenu, // Associate 'menu' with the showMainMenu function
    execute_command: execute_command, // Associate 'menu' with the showMainMenu function
    fetch_subscriber_info: subscriber_information, // Associate 'fetch_subscriber_info' with subscriber_information function
    create_psb: createPSB, // Associate 'fetch_subscriber_info' with subscriber_information function
    odoo_crud_operations:odoo_crud_operations,
    search_or_scrape:search_or_scrape,
    autonomous_project_management: autonomous_project_management, // Associate 'autonomous_project_management' with autonomous_project_management function

};
async function agentServicePlugin(server, opts) {
    const startTime = moment();
    const content = fs.readFileSync('system_instruction.txt', 'utf-8').trim();
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Endpoint untuk memeriksa status agen
    server.get(`${ENDPOINT}/:id/status`,  async (request, reply) => {
        const { id } = request.params;
        try {
            const agent = await server.localDb.Agent.findByPk(id);
            if (agent) {
                return reply.send({ id: agent.id, name: agent.name, status: agent.isOnline ? 'online' : 'offline' });
            }
            return reply.status(404).send({ error: 'Agent not found' });
        } catch (error) {
            server.log.error('[ERROR] Failed to get agent status:', error);
            return reply.status(500).send({ error: 'Failed to get agent status' });
        }
    });

    // Endpoint untuk listing semua agen
    server.get(`${ENDPOINT}`,  async (request, reply) => {
        try {
            const agents = await server.localDb.Agent.findAll();
            return reply.send(agents);
        } catch (error) {
            server.log.error('[ERROR] Failed to list agents:', error);
            return reply.status(500).send({ error: 'Failed to list agents' });
        }
    });

    // Endpoint untuk menambah agen
    server.post(`${ENDPOINT}`,  async (request, reply) => {
        const { name, model_name, system_instruction, temperature, top_k, top_p, max_output_tokens, api_key } = request.body;
        if (!name || !model_name || !api_key) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }

        try {
            const agent = await server.localDb.Agent.create({
                name,
                model_name,
                system_instruction,
                temperature,
                top_k,
                top_p,
                max_output_tokens,
                api_key,
                isOnline: false
            });
            return reply.status(201).send(agent);
        } catch (error) {
            server.log.error('[ERROR] Failed to create agent:', error);
            return reply.status(500).send({ error: 'Failed to create agent' });
        }
    });

    // Endpoint untuk memperbarui status agen
    server.put(`${ENDPOINT}/:id/status`,  async (request, reply) => {
        const { id } = request.params;
        const { isOnline } = request.body;

        try {
            const agent = await server.localDb.Agent.findByPk(id);
            if (agent) {
                agent.isOnline = isOnline;
                await agent.save();
                return reply.send({ id: agent.id, name: agent.name, status: isOnline ? 'online' : 'offline' });
            }
            return reply.status(404).send({ error: 'Agent not found' });
        } catch (error) {
            server.log.error('[ERROR] Failed to update agent status:', error);
            return reply.status(500).send({ error: 'Failed to update agent status' });
        }
    });

    // Endpoint untuk menghapus agen
    server.delete(`${ENDPOINT}/:id`,  async (request, reply) => {
        const { id } = request.params;
        try {
            const agent = await server.localDb.Agent.findByPk(id);
            if (agent) {
                await agent.destroy();
                return reply.send({ message: 'Agent deleted successfully' });
            }
            return reply.status(404).send({ error: 'Agent not found' });
        } catch (error) {
            server.log.error('[ERROR] Failed to delete agent:', error);
            return reply.status(500).send({ error: 'Failed to delete agent' });
        }
    });

    // Endpoint untuk mengirim pesan ke agen
        server.post(`${ENDPOINT}/:id/chat`, async (request, reply) => {
            const { id } = request.params;
            const { message, system_instruction, uid } = request.body;
        
            if (!message) {
                return reply.status(400).send({ error: 'Message is required' });
            }
        
            try {
                const agent = await server.localDb.Agent.findByPk(id);
        
                if (!agent) {
                    return reply.status(404).send({ error: 'Agent not found' });
                }
        
                const worldInfo = getOSAndWorldInfo();
                const world_information = `
                #World Information:\n
                Platform: ${worldInfo.platform}
                Release: ${worldInfo.release}
                Architecture: ${worldInfo.arch}
                Hostname: ${worldInfo.hostname}
                World Information:
                Local Time: ${worldInfo.localTime}
                Time Zone: ${worldInfo.timeZone}\n
            `;
                // Use system_instruction from request body if provided, otherwise fallback to agent's system_instruction
            const effectiveSystemInstruction = system_instruction || agent.system_instruction || 'No system instruction available';
            const finalSystemInstruction = `${world_information}
            #System Instruction:\n
            ${effectiveSystemInstruction}\n
        `;
                const history = getMemory(id, uid);
                const model = genAI.getGenerativeModel({
                    model: agent.model_name,
                    safetySettings: SAFETY_SETTINGS,
                    systemInstruction: finalSystemInstruction,
                    tools: {
                        functionDeclarations: [
                            showMainMenuFunctionDeclaration,
                            subscriber_informationFunctionDeclaration,
                            createPSBFunctionDeclaration,
                            execute_command_tool,
                            odooCrudFunctionDeclaration,
                            search_or_scrapeFunctionDeclaration
                            
                            // autonomous_project_management_tool // Register tool here
                        ],
                    },
                });
        
                const chatInstance = await model.startChat({
                    generationConfig: {
                        temperature: agent.temperature,
                        topK: agent.top_k,
                        topP: agent.top_p
                    },
                    history
                });
        
                if (!chatInstance) {
                    return reply.status(500).send({ error: 'Failed to start chat instance' });
                }
                saveMemory(id, uid, message, 'user');
                let result = await chatInstance.sendMessage(message);
                let functionCalls = result.response.functionCalls() || [];
                
                while (functionCalls.length > 0) {
                    const apiResponses = [];
                    console.log('functionCallstest',functionCalls)
                    for (const call of functionCalls) {
                        const handler = functionHandlers[call.name];
                        if (handler) {
                            const parameters = call.args;
                            const functionResponse = await handler(parameters);
                            apiResponses.push({
                                name: call.name,
                                response: {
                                    name: call.name,
                                    content: JSON.stringify(functionResponse)
                                }
                            });
                        } else {
                            apiResponses.push({
                                name: call.name,
                                response: {
                                    name: call.name,
                                    content: `Function '${call.name}' is not implemented`
                                }
                            });
                        }
                    }
        
                    const functionResponses = apiResponses.map(({ name, response }) => ({
                        functionResponse: {
                            name,
                            response
                        }
                    }));
        
                    result = await chatInstance.sendMessage(
                        functionResponses.map(({ functionResponse }) => ({
                            functionResponse: {
                                name: functionResponse.name,
                                response: {
                                    content: functionResponse.response.content
                                }
                            }
                        }))
                    );
        
                    functionCalls = result.response.functionCalls() || [];
                }
                
                // Return the final result text
                if (typeof result.response.text === 'function') {
                    saveMemory(id, uid, result.response.text(), 'model');
                    return reply.send({ response: await result.response.text() });
                }
                saveMemory(id, uid, result.response.text(), 'model');
                return reply.send({ response: result.response.text() || 'No response available' });
        
            } catch (error) {
                console.log(error);
                server.log.error('[ERROR] Failed to send message to agent:', error);
                return reply.status(500).send({ error: 'Failed to send message to agent' });
            }
        });
    
        server.post(`${ENDPOINT}/whatsapp/:uid/chat`, async (request, reply) => {
            const { uid } = request.params;
            const { message, system_instruction,} = request.body;
        
            if (!message) {
                return reply.status(400).send({ error: 'Message is required' });
            }
        
            try {
                const agent = await server.localDb.Agent.findOne({
                    where: { uid: uid }
                });
        
                if (!agent) {
                    return reply.status(404).send({ error: 'Agent not found' });
                }
        
                const worldInfo = getOSAndWorldInfo();
                const world_information = `
                #World Information:\n
                Platform: ${worldInfo.platform}
                Release: ${worldInfo.release}
                Architecture: ${worldInfo.arch}
                Hostname: ${worldInfo.hostname}
                World Information:
                Local Time: ${worldInfo.localTime}
                Time Zone: ${worldInfo.timeZone}\n
            `;
                // Use system_instruction from request body if provided, otherwise fallback to agent's system_instruction
            const effectiveSystemInstruction = system_instruction || agent.system_instruction || 'No system instruction available';
            const finalSystemInstruction = `${world_information}
            #System Instruction:\n
            ${effectiveSystemInstruction}\n
        `;
                const history = getMemory(agent.id, uid);
                const model = genAI.getGenerativeModel({
                    model: agent.model_name,
                    safetySettings: SAFETY_SETTINGS,
                    systemInstruction: finalSystemInstruction,
                    tools: {
                        functionDeclarations: [
                            showMainMenuFunctionDeclaration,
                            subscriber_informationFunctionDeclaration,
                            createPSBFunctionDeclaration,
                            execute_command_tool,
                            odooCrudFunctionDeclaration,
                            search_or_scrapeFunctionDeclaration
                            
                            // autonomous_project_management_tool // Register tool here
                        ],
                    },
                });
        
                const chatInstance = await model.startChat({
                    generationConfig: {
                        temperature: agent.temperature,
                        topK: agent.top_k,
                        topP: agent.top_p
                    },
                    history
                });
        
                if (!chatInstance) {
                    return reply.status(500).send({ error: 'Failed to start chat instance' });
                }
                saveMemory(agent.id, uid, message, 'user');
                let result = await chatInstance.sendMessage(message);
                let functionCalls = result.response.functionCalls() || [];
                
                while (functionCalls.length > 0) {
                    const apiResponses = [];
                    console.log('functionCallstest',functionCalls)
                    for (const call of functionCalls) {
                        const handler = functionHandlers[call.name];
                        if (handler) {
                            const parameters = call.args;
                            const functionResponse = await handler(parameters);
                            apiResponses.push({
                                name: call.name,
                                response: {
                                    name: call.name,
                                    content: JSON.stringify(functionResponse)
                                }
                            });
                        } else {
                            apiResponses.push({
                                name: call.name,
                                response: {
                                    name: call.name,
                                    content: `Function '${call.name}' is not implemented`
                                }
                            });
                        }
                    }
        
                    const functionResponses = apiResponses.map(({ name, response }) => ({
                        functionResponse: {
                            name,
                            response
                        }
                    }));
        
                    result = await chatInstance.sendMessage(
                        functionResponses.map(({ functionResponse }) => ({
                            functionResponse: {
                                name: functionResponse.name,
                                response: {
                                    content: functionResponse.response.content
                                }
                            }
                        }))
                    );
        
                    functionCalls = result.response.functionCalls() || [];
                }
                
                // Return the final result text
                if (typeof result.response.text === 'function') {
                    saveMemory(agent.id, uid, result.response.text(), 'model');
                    return reply.send({ response: await result.response.text() });
                }
                saveMemory(agent.id, uid, result.response.text(), 'model');
                return reply.send({ response: result.response.text() || 'No response available' });
        
            } catch (error) {
                console.log(error);
                server.log.error('[ERROR] Failed to send message to agent:', error);
                return reply.status(500).send({ error: 'Failed to send message to agent' });
            }
        }); 
    
    
}

export default fp(agentServicePlugin);
