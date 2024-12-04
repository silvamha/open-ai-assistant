const OpenAI = require('openai');
const config = require('../config/config');
const personality = require('../config/assistant-personality');

class AssistantService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
        // Store assistant ID in environment or config
        this.assistantId = process.env.ASSISTANT_ID || config.openai.assistantId;
    }

    async initializeAssistant() {
        try {
            // Only create a new assistant if we don't have an ID
            if (!this.assistantId) {
                console.log('Creating new assistant...');
                const assistant = await this.openai.beta.assistants.create({
                    name: personality.name,
                    instructions: personality.instructions,
                    tools: [{ type: "code_interpreter" }],
                    model: config.openai.model
                });
                this.assistantId = assistant.id;
                console.log('Assistant created with ID:', this.assistantId);
                console.log('Please save this ID in your .env file as ASSISTANT_ID=', this.assistantId);
            } else {
                console.log('Using existing assistant:', this.assistantId);
            }
        } catch (error) {
            console.error('Error initializing assistant:', error);
            throw error;
        }
    }

    async createThread() {
        try {
            return await this.openai.beta.threads.create();
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    async addMessage(threadId, content) {
        try {
            return await this.openai.beta.threads.messages.create(
                threadId,
                {
                    role: "user",
                    content: content
                }
            );
        } catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    }

    async runAssistant(threadId) {
        try {
            const run = await this.openai.beta.threads.runs.create(
                threadId,
                { assistant_id: this.assistantId }
            );

            // Wait for the run to complete
            let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
            
            while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
            }

            if (runStatus.status === 'completed') {
                return runStatus;
            } else {
                throw new Error(`Run failed with status: ${runStatus.status}`);
            }
        } catch (error) {
            console.error('Error running assistant:', error);
            throw error;
        }
    }

    async getResponse(threadId) {
        try {
            const messages = await this.openai.beta.threads.messages.list(threadId);
            return messages.data[0].content[0].text.value;
        } catch (error) {
            console.error('Error getting response:', error);
            throw error;
        }
    }
}

const assistantService = new AssistantService();

// Initialize on startup
assistantService.initializeAssistant().catch(console.error);

module.exports = assistantService;
