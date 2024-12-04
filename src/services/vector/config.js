require('dotenv').config();

module.exports = {
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
        vectorTable: 'chat_embeddings',
        // Columns in our vector table
        columns: {
            content: 'content',        // The actual message content
            embedding: 'embedding',     // Vector embedding
            metadata: 'metadata',       // Additional info (user, timestamp, etc)
            threadId: 'thread_id'      // OpenAI thread ID
        }
    },
    openai: {
        embeddingModel: 'text-embedding-3-small'  // Latest embedding model
    }
};
