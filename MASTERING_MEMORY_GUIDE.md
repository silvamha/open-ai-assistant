# Mastering Session Memory Implementation Guide

## Overview
This guide details how to implement persistent memory for mastering sessions using Supabase vector storage.

## Database Schema

```sql
-- Mastering Projects
create table mastering_projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  artist text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mastering Sessions
create table mastering_sessions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references mastering_projects(id),
  session_date timestamp with time zone default timezone('utc'::text, now()) not null,
  stage text, -- 'EQ', 'Compression', 'Limiting', etc.
  notes text
);

-- Chat Messages with Vector Embeddings
create table chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references mastering_sessions(id),
  speaker text not null, -- 'user' or 'assistant'
  content text not null,
  embedding vector(1536),
  technical_params jsonb, -- store specific technical settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Implementation Steps

### 1. Update Assistant Service
```javascript
// src/services/assistant.js

const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');

class AssistantService {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    this.openai = new OpenAIApi(new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    }));
  }

  async createMasteringProject(title, artist) {
    const { data, error } = await this.supabase
      .from('mastering_projects')
      .insert([{ title, artist }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMasteringSession(projectId, stage) {
    const { data, error } = await this.supabase
      .from('mastering_sessions')
      .insert([{ project_id: projectId, stage }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async storeMessage(sessionId, speaker, content, technicalParams = null) {
    // Create embedding for the message
    const embedding = await this.openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: content
    });

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        speaker,
        content,
        embedding: embedding.data[0].embedding,
        technical_params: technicalParams
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchSimilarDiscussions(query, limit = 5) {
    const embedding = await this.openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query
    });

    const { data, error } = await this.supabase.rpc('match_messages', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) throw error;
    return data;
  }
}

module.exports = new AssistantService();
```

### 2. Add Supabase Function for Similarity Search
```sql
create or replace function match_messages (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  content text,
  similarity float,
  technical_params jsonb,
  session_id uuid
)
language plpgsql
as $$
begin
  return query
  select
    chat_messages.content,
    1 - (chat_messages.embedding <=> query_embedding) as similarity,
    chat_messages.technical_params,
    chat_messages.session_id
  from chat_messages
  where 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
  order by chat_messages.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### 3. Update Chat Route
```javascript
// src/routes/chat.js

app.post('/api/chat', async (req, res) => {
  try {
    const { message, projectId, sessionId, technicalParams } = req.body;
    
    // Store user message
    await assistantService.storeMessage(sessionId, 'user', message, technicalParams);
    
    // Search for similar past discussions
    const similarDiscussions = await assistantService.searchSimilarDiscussions(message);
    
    // Create context from similar discussions
    const context = similarDiscussions.map(d => d.content).join('\n');
    
    // Add context to assistant prompt
    const threadMessages = [
      { role: 'system', content: 'Previous relevant discussions:\n' + context },
      { role: 'user', content: message }
    ];
    
    // Get assistant response
    const response = await assistantService.getResponse(threadMessages);
    
    // Store assistant response
    await assistantService.storeMessage(sessionId, 'assistant', response, technicalParams);
    
    res.json({ response, similarDiscussions });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Usage Example

```javascript
// Create a new mastering project
const project = await assistantService.createMasteringProject(
  "Dark Side of the Moon",
  "Pink Floyd"
);

// Create a mastering session
const session = await assistantService.createMasteringSession(
  project.id,
  "EQ"
);

// Store a message with technical parameters
await assistantService.storeMessage(
  session.id,
  'user',
  'The low end needs more punch around 60Hz',
  {
    frequency: 60,
    gain: 2.5,
    q: 1.2,
    plugin: 'FabFilter Pro-Q 3'
  }
);

// Search for similar discussions
const similar = await assistantService.searchSimilarDiscussions(
  'How did we handle the low end in the previous session?'
);
```

## Best Practices

1. **Session Organization**
   - Create new sessions for major changes
   - Tag sessions with specific stages
   - Include technical parameters whenever possible

2. **Message Storage**
   - Store both user and assistant messages
   - Include relevant technical parameters
   - Tag messages with specific processing stages

3. **Search Optimization**
   - Be specific in your queries
   - Use technical terms consistently
   - Reference specific frequency ranges, tools, or techniques

4. **Context Management**
   - Keep project contexts separate
   - Link related sessions together
   - Maintain clear progression of changes

## Next Steps

1. Add session timeline visualization
2. Implement A/B comparison tracking
3. Add reference track management
4. Create mastering chain presets storage
5. Add waveform/spectrum analysis storage

Remember: This system will grow more valuable over time as it accumulates your mastering wisdom and decisions!
