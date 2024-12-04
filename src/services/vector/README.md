# Vector Storage Service

This module handles vector embeddings and storage in Supabase. It's designed to be completely isolated from the main application, making it easy to remove or modify without affecting core functionality.

## Structure
- `config.js` - Supabase and OpenAI embedding configuration
- `service.js` - Vector storage service implementation
- `types.js` - TypeScript-like type definitions for better documentation

## Usage
The service is designed to be pluggable. If Supabase integration fails or needs to be removed, the main application will continue to function normally.
