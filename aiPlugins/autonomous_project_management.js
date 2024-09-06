import axios from 'axios';
import { setTimeout } from 'timers/promises'; // Using promises-based setTimeout
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to write log to file
const writeLog = (message, project_id) => {
    const logFilePath = path.join(__dirname, `project_management_log_${project_id}.txt`);
    fs.appendFileSync(logFilePath, message + '\n', 'utf8');
};

// Function to send task details to API
const sendTaskDetails = async (task, project_id) => {
    const taskMessage = `Task ID: ${task.id}\nDescription: ${task.description}\nPriority: ${task.priority}\nDue Date: ${task.due_date}\nAssignee: ${task.assignee}`;
    const data = JSON.stringify({
        message: taskMessage
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://localhost:3001/api/v1/agents/1/chat',
        headers: { 
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const response = await axios(config);
        writeLog(`Task sent successfully: ${response.data}`, project_id);
    } catch (error) {
        writeLog(`Error sending task: ${error.message}`, project_id);
    }
};

// Function to manage autonomous project tasks
export const autonomous_project_management = async (params) => {
    const { project_name, project_description, project_goal, project_timeline, task_list, execution_duration, report_recipient, commands } = params;

    const project_id = Date.now().toString(); // Unique project ID
    const startMessage = `Starting autonomous project management for: "${project_name}" with Project ID: ${project_id}`;
    console.log(startMessage);
    writeLog(startMessage, project_id);

    // Validate project parameters
    if (!project_name || !project_description || !project_goal || !project_timeline) {
        const errorMessage = "Error: Project name, description, goal, and timeline are required.";
        console.error(errorMessage);
        writeLog(errorMessage, project_id);
        return { error: errorMessage };
    }

    // Validate task list
    if (!task_list || !Array.isArray(task_list) || task_list.length < 10) {
        const errorMessage = "Error: At least 10 tasks are required in the task list.";
        console.error(errorMessage);
        writeLog(errorMessage, project_id);
        return { error: errorMessage };
    }

    // Create project
    const project = {
        id: project_id,
        name: project_name,
        description: project_description,
        goal: project_goal,
        timeline: project_timeline,
        tasks: {},
        status: 'Not Started'
    };

    // Add tasks
    for (const task of task_list) {
        const task_id = Date.now().toString(); // Unique task ID
        project.tasks[task_id] = { ...task, status: 'pending' };
    }

    // Write project details to log
    writeLog(`Project Created: ${JSON.stringify(project, null, 2)}`, project_id);

    // Execute system commands if provided
    if (commands && commands.length > 0) {
        for (const command of commands) {
            const commandMessage = `Executing command: ${command}`;
            console.log(commandMessage);
            writeLog(commandMessage, project_id);

            const result = await executeCommand(command, project_id);
            if (result.error) {
                console.error(`Command failed: ${result.error}`);
                writeLog(`Command failed: ${result.error}`, project_id);
            } else {
                console.log(`Command output: ${result.output}`);
            }
        }
    }

    // Send task details to API
    for (const task_id in project.tasks) {
        const task = project.tasks[task_id];
        await sendTaskDetails(task, project_id);
        // Optional: Add delay to avoid overwhelming the server
        await setTimeout(1000); // 1 second delay between requests
    }

    // Simulate task execution
    const executeTasks = async () => {
        const executingMessage = `Executing tasks for project ID: ${project_id}`;
        console.log(executingMessage);
        writeLog(executingMessage, project_id);

        const task_ids = Object.keys(project.tasks);
        
        for (const task_id of task_ids) {
            const task = project.tasks[task_id];
            if (task.status !== 'completed') {
                const taskMessage = `Starting task ${task_id}: ${task.description}`;
                console.log(taskMessage);
                writeLog(taskMessage, project_id);

                // Simulate task processing time
                await setTimeout(2000); // Simulate 2 seconds task execution time
                project.tasks[task_id].status = 'completed';

                const completionMessage = `Task ${task_id} completed.`;
                console.log(completionMessage);
                writeLog(completionMessage, project_id);
            }
        }

        project.status = 'Completed';
        const projectCompletionMessage = `Project ID: ${project_id} completed.`;
        console.log(projectCompletionMessage);
        writeLog(projectCompletionMessage, project_id);
    };

    // Execute tasks and commands continuously until the project duration is reached or status is updated
    const durationInMillis = execution_duration * 60 * 1000; // Convert duration from minutes to milliseconds
    const startTime = Date.now();

    while (project.status === 'Not Started' || project.status === 'Ongoing') {
        await executeTasks();
        await setTimeout(5000); // Check every 5 seconds

        if (Date.now() - startTime >= durationInMillis) {
            project.status = 'Completed';
            const durationMessage = `Execution duration reached. Project ID: ${project_id} marked as Completed.`;
            console.log(durationMessage);
            writeLog(durationMessage, project_id);
            break;
        }
    }

    // Generate final report
    const generateFinalReport = () => {
        const reportContent = `Final Report for Project ID: ${project_id}\n` +
                              `Project Name: ${project_name}\n` +
                              `Description: ${project_description}\n` +
                              `Goal: ${project_goal}\n` +
                              `Timeline: ${project_timeline}\n` +
                              `Status: ${project.status}\n` +
                              `Tasks:\n` +
                              Object.keys(project.tasks).map(task_id => {
                                  const task = project.tasks[task_id];
                                  return `  Task ID: ${task_id}\n` +
                                         `    Description: ${task.description}\n` +
                                         `    Priority: ${task.priority}\n` +
                                         `    Status: ${task.status}\n`;
                              }).join('\n');

        // Write the report to a file
        const reportFilePath = path.join(__dirname, `final_report_${project_id}.txt`);
        fs.writeFileSync(reportFilePath, reportContent, 'utf8');
        
        // Optionally send the report to the recipient
        if (report_recipient) {
            console.log(`Sending report to ${report_recipient}`);
            writeLog(`Sending report to ${report_recipient}`, project_id);
            // Simulate sending email or other communication (e.g., SMTP, API request)
        }
        
        return reportFilePath;
    };

    const finalMessage = `Project completed successfully.`;
    console.log(finalMessage);
    writeLog(finalMessage, project_id);

    // Generate and include final report
    const reportPath = generateFinalReport();
    writeLog(`Final report generated at: ${reportPath}`, project_id);

    return { message: finalMessage, project: project, report_path: reportPath };
};

// Define tool for autonomous project management
export const autonomous_project_management_tool = {
    name: "autonomous_project_management",
    description: "Manage a project autonomously including creating, scheduling, and executing tasks until project completion. Includes detailed task management, command execution, and final reporting.",
    parameters: {
        type: "OBJECT",
        description: "Autonomously manage a project including creation, scheduling, and execution of tasks. Includes command execution and final reporting.",
        properties: {
            project_name: {
                type: "STRING",
                description: "Name of the project."
            },
            project_description: {
                type: "STRING",
                description: "Description of the project."
            },
            project_goal: {
                type: "STRING",
                description: "Goal of the project."
            },
            project_timeline: {
                type: "STRING",
                description: "Timeline of the project."
            },
            task_list: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        description: {
                            type: "STRING",
                            description: "Description of the task ."
                        },
                        priority: {
                            type: "STRING",
                            description: "Priority of the task."
                        },
                        due_date: {
                            type: "STRING",
                            description: "Due date of the task."
                        },
                        assignee: {
                            type: "STRING",
                            description: "Assignee of the task."
                        }
                    },
                    required: ["description", "priority", "due_date", "assignee"]
                },
                minItems: 10,
                description: "List of tasks for the project. Must include at least 10 tasks."
            },
            execution_duration: {
                type: "NUMBER",
                description: "Duration of the project execution in minutes."
            },
            report_recipient: {
                type: "STRING",
                description: "Email or contact info of the recipient to whom the final report should be sent."
            },
            
        },
        required: ["project_name", "project_description", "project_goal", "project_timeline", "task_list", "execution_duration"]
    }
};
