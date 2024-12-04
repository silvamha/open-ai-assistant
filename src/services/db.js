const { MongoClient } = require('mongodb');
const config = require('../config/config');

class DatabaseService {
    constructor() {
        this.client = new MongoClient(config.mongodb.uri);
        this.dbName = 'ai-assistant';
    }

    async connect() {
        try {
            await this.client.connect();
            console.log('Connected to MongoDB');
            this.db = this.client.db(this.dbName);
            this.conversations = this.db.collection('conversations');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async saveConversation(userId, threadId, messages) {
        try {
            const conversation = {
                userId,
                threadId,
                messages,
                updatedAt: new Date(),
            };

            await this.conversations.updateOne(
                { threadId },
                { $set: conversation },
                { upsert: true }
            );
            return conversation;
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw error;
        }
    }

    async getConversations(userId) {
        try {
            return await this.conversations
                .find({ userId })
                .sort({ updatedAt: -1 })
                .toArray();
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    async deleteConversation(threadId) {
        try {
            await this.conversations.deleteOne({ threadId });
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
