require('dotenv').config();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const VECTOR_TABLE = 'chat_embeddings';

async function createEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error creating embedding:', error);
        return null;
    }
}

async function storeChat(content, metadata = {}, threadId = null) {
    console.log(`Processing chat message: ${content.slice(0, 50)}...`);
    
    try {
        const embedding = await createEmbedding(content);
        if (!embedding) {
            console.error('Failed to create embedding, skipping message');
            return;
        }

        const { error } = await supabase
            .from(VECTOR_TABLE)
            .insert({
                content: content,
                embedding: embedding,
                metadata: metadata,
                thread_id: threadId
            });

        if (error) throw error;
        console.log('Successfully stored chat message with embedding');
    } catch (error) {
        console.error('Error storing chat:', error);
    }
}

// Example usage:
async function main() {
    // You can load chats from a file, database, or pass them directly
    const sampleChats = [
        {
            content: "How do I implement authentication in my Node.js app?",
            metadata: { role: 'user', timestamp: '2024-02-10T12:00:00Z' },
            threadId: 'thread_123'
        },
        {
            content: "To implement authentication in Node.js, you can use Passport.js or JWT...",
            metadata: { role: 'assistant', timestamp: '2024-02-10T12:01:00Z' },
            threadId: 'thread_123'
        }
    ];

    for (const chat of sampleChats) {
        await storeChat(chat.content, chat.metadata, chat.threadId);
    }
}

// Only run if called directly (not imported)
if (require.main === module) {
    main()
        .then(() => {
            console.log('Embedding process complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error in main process:', error);
            process.exit(1);
        });
}
