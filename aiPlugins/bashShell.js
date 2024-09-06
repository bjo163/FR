import { spawn } from 'child_process';

// Function to execute a command using spawn
export const execute_command = async (params) => {
    const { command_content, fallback_command } = params;
    console.log(`Received command for execution: "${command_content} with fallback ${fallback_command}"`);
    
    if (!command_content) {
        console.error("Error: No command provided");
        return { error: "No command provided" };
    }

    const [command, ...args] = command_content.split(' ');

    try {
        console.log(`Starting execution of command: "${command_content}"`);
        const process = spawn(command, args, { shell: true });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const result = await new Promise((resolve, reject) => {
            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Execution failed with code ${code}`);
                    reject(`Error: Command failed with exit code ${code}`);
                    return;
                }
                console.log(`Command executed successfully: "${command_content}"`);
                resolve(stdout);
            });
        });

        console.log(`Command output: "${stdout}"`);
        return { output: result };
    } catch (error) {
        console.error(`Error during command execution: ${error}`);

        // Fallback mechanism
        if (fallback_command) {
            console.log(`Attempting fallback command: "${fallback_command}"`);
            return await execute_command({ command_content: fallback_command });
        }

        return { error: error.toString() };
    }
};

// Define tool for the command execution
export const execute_command_tool = {
    name: "execute_command",
    description: "Execute a command with optional fallback.",
    parameters: {
        type: "OBJECT",
        description: "Executes a shell command with a fallback if the first command fails.",
        properties: {
            command_content: {
                type: "STRING",
                description: "The main command to execute."
            },
            fallback_command: {
                type: "STRING",
                description: "An optional command to execute if the main command fails."
            }
        },
        required: ["command_content"]
    }
};
