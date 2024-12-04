const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const config = require('./config');

class VectorService {
    constructor() {
        // Initialize with null - we'll connect lazily
        this.supabase = null;
        this.openai = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Only initialize if we have all required credentials
            if (!config.supabase.url || !config.supabase.key) {
                console.log('Supabase credentials not found - vector storage disabled');
                return false;
            }

            this.supabase = createClient(config.supabase.url, config.supabase.key);
            this.openai = new OpenAI();
            
            // Test the connection
            const { data, error } = await this.supabase.from(config.supabase.vectorTable).select('id').limit(1);
            if (error) throw error;

            this.isInitialized = true;
            console.log('Vector storage service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize vector storage:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async storeMessage(message, threadId) {
        if (!this.isInitialized) return null;

        try {
            // Generate embedding
            const embedding = await this.openai.embeddings.create({
                model: config.openai.embeddingModel,
                input: message.content
            });

            // Store in Supabase
            const { data, error } = await this.supabase
                .from(config.supabase.vectorTable)
                .insert({
                    [config.supabase.columns.content]: message.content,
                    [config.supabase.columns.embedding]: embedding.data[0].embedding,
                    [config.supabase.columns.metadata]: {
                        role: message.role,
                        timestamp: new Date().toISOString()
                    },
                    [config.supabase.columns.threadId]: threadId
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to store message vector:', error);
            return null;
        }
    }

    async searchSimilarMessages(query, limit = 5) {
        if (!this.isInitialized) return [];

        try {
            // Generate embedding for query
            const embedding = await this.openai.embeddings.create({
                model: config.openai.embeddingModel,
                input: query
            });

            // Search using vector similarity
            const { data, error } = await this.supabase.rpc('match_chat_messages', {
                query_embedding: embedding.data[0].embedding,
                match_threshold: 0.7,
                match_count: limit
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to search similar messages:', error);
            return [];
        }
    }
}

// Export as singleton
module.exports = new VectorService();
