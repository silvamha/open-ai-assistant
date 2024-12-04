import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@supabase/supabase-js";
import fs from 'fs/promises'; // Update to use Node.js fs for reading files
import dotenv from 'dotenv';   // Import dotenv

// Load environment variables from .env file
dotenv.config(); 

// Access environment variables using process.env
const apiKey = process.env.VITE_MISTRAL_EMBEDDINGS_1_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPASE_API_KEY;

// Setup Mistral and Supabase clients
const mistralClient = new Mistral({ apiKey: apiKey });
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to split document into manageable chunks
async function splitDocument(path) {
    console.log(`Starting to split document: ${path}`);
    try {
        const text = await fs.readFile(path, 'utf-8'); // Read the file directly using Node.js fs module
        console.log(`Document fetched successfully: ${path}`);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 250,   // Define the chunk size
            chunkOverlap: 40, // Define chunk overlap
        });

        // Split the document and extract chunks
        const output = await splitter.createDocuments([text]);
        console.log(`Document split into ${output.length} chunks: ${path}`);
        
        const textArr = output.map((chunk) => chunk.pageContent);
        return textArr;
    } catch (error) {
        console.error(`Error reading the document at ${path}:`, error);
        return [];
    }
}

// Function to create embeddings for document chunks
async function createEmbeddings(chunks) {
    console.log(`Creating embeddings for ${chunks.length} chunks...`);

    try {
        const embeddings = await mistralClient.embeddings.create({
            model: "mistral-embed",
            inputs: chunks,
        });

        console.log("Embeddings created successfully.");

        // Create a data object that links embeddings to content chunks
        const data = chunks.map((chunk, i) => {
            return {
                content: chunk,
                embedding: embeddings.data[i].embedding,
            };
        });
        return data;
    } catch (error) {
        console.error("Error creating embeddings:", error);
        return [];
    }
}

// Function to upload data to Supabase
async function uploadToSupabase(data) {
    console.log("Starting upload to Supabase...");

    const { error } = await supabase.from('handbook_docs').insert(data);

    if (error) {
        console.error("Error inserting data into Supabase:", error);
    } else {
        console.log("Upload complete for data:", data);
    }
}

// List of documents to be added to the RAG system
const documentPaths = [
    "./text/black-and-white.txt",
    "./text/breeding.txt",
    "./text/lisa-submission.txt",
    "./text/luisa-requirements.txt",
    "./text/my-husband.txt",
    "./text/nailed.txt",
];

// Main function to process multiple documents
async function processDocuments() {
    for (const path of documentPaths) {
        console.log(`Processing ${path}...`);

        // Step 1: Split the document into chunks
        const documentChunks = await splitDocument(path);
        if (documentChunks.length === 0) {
            console.error(`Failed to split document: ${path}`);
            continue;
        }

        // Step 2: Create embeddings for the document chunks
        const data = await createEmbeddings(documentChunks);
        if (data.length === 0) {
            console.error(`Failed to create embeddings for document: ${path}`);
            continue;
        }

        // Step 3: Upload the data to Supabase
        await uploadToSupabase(data);
    }

    console.log("All documents processed successfully!");
}

// Execute the document processing function
processDocuments();
