## mcp-ollama
Template for setting up MCP Tools to Ollama and possibility to prompt from a thirdparty client

## Running

#### MCP Hosts file

Put this file in your home directory, mcphost will look for it
```json
{
    "mcpServers": {
        "experimental-mcp-tools": {
            "type": "local",
            "command": "python",
            "args": [
                "-u",
                "C:\\path\\to\\my\\mcp-tools\\server.py"
            ]
        }
    }
}
```

#### Startup
```
ollama serve
go run server/main.go
``` 

#### API

```http
POST http://localhost:8080/chat

{
    message: "How is the weather in Stockholm?"
}
```

