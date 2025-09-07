package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/mark3labs/mcphost/sdk"
)

type ChatReq struct {
	Message string `json:"message"`
}

type ChatResp struct {
	Text string `json:"text"`
}

func main() {
	// mcphost reads ~/.mcphost.yml|.json for your model + MCP servers
	host, err := sdk.New(context.Background(), &sdk.Options{
		Model: "ollama:llama3.1:8b",
	})
	if err != nil {
		log.Fatal(err)
	}
	defer host.Close()

	http.HandleFunc("/chat", func(w http.ResponseWriter, r *http.Request) {
		var req ChatReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		// Simple, non-streaming:
		resp, err := host.Prompt(r.Context(), req.Message)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(ChatResp{Text: resp})
	})

	// For streaming, use host.PromptStream(ctx, cb) from the SDK and write SSE/WS frames here.

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
