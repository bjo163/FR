import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MEMORY_DIR = join(process.cwd(), 'memory');

if (!existsSync(MEMORY_DIR)) {
    mkdirSync(MEMORY_DIR);
}

function getMemoryFilePath(agentId, uid) {
    return join(MEMORY_DIR, `agent_${agentId}_uid_${uid}.json`);
}

export function saveMemory(agentId, uid, newMessage, role) {
    const filePath = getMemoryFilePath(agentId, uid);

    let history = [];

    if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath);
        history = JSON.parse(fileContent).history || [];
    }

    // Ensure the new message is in the required format
    const formattedMessage = {
        role,
        parts: [{ text: newMessage }]
    };

    history.push(formattedMessage);

    writeFileSync(filePath, JSON.stringify({ history }, null, 2));
}

export function getMemory(agentId, uid) {
    const filePath = getMemoryFilePath(agentId, uid);

    if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath);
        return JSON.parse(fileContent).history || [];
    }

    return [];
}
