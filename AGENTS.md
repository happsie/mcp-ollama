## Features

- Chat with a ollama LLM from React that has MCP Tools connected by McpHost

## Architecture

- The code should be modular
- The code should be easy to refactor and decoupled

## Code style

- A method can not be longer than 20 lines
- Reuse code when possible
- Keep it simple stupid (KISS)

## Technology

- Golang
- Python
- mcphost
- FastMCP
- React
- Tailwind3
- Ollama

### Frontend

- Use React for frontend
- Use tailwind3 for css styling
- Use tanstack query for requests 

### Backend

- Use Golang and use McpHost as a framework
- Add endpoints to stream the chat conversation

### MCP

- Use FastMCP and python to register tools

### LLM
 
- Ollama