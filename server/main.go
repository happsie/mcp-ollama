package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
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
	host := mustNewHost()
	defer host.Close()

	http.HandleFunc("/chat", sseChatHandler(host))

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func mustNewHost() *sdk.MCPHost {
	h, err := sdk.New(context.Background(), &sdk.Options{Model: "ollama:llama3.1:8b", Streaming: true})
	if err != nil {
		log.Fatal(err)
	}
	return h
}

func sseChatHandler(host *sdk.MCPHost) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !preflightAndCORS(w, r) {
			return
		}
		flusher, ok := setupSSE(w)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}
		req, err := decodeChatReq(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		streamPrompt(r.Context(), host, req.Message, w, flusher)
	}
}

func preflightAndCORS(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return false
	}
	return true
}

func setupSSE(w http.ResponseWriter) (http.Flusher, bool) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, false
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	return flusher, true
}

func decodeChatReq(r *http.Request) (ChatReq, error) {
	var req ChatReq
	err := json.NewDecoder(r.Body).Decode(&req)
	return req, err
}

func streamPrompt(ctx context.Context, host *sdk.MCPHost, msg string, w http.ResponseWriter, f http.Flusher) {
	_, err := host.PromptWithCallbacks(ctx, msg, func(name, args string) {
		slog.Info("tool called", "name", name, "args", args)
	}, func(name, args, result string, isError bool) {
		slog.Info("tool answer", "name", name, "args", args, "result", result, "isError", isError)
	}, func(chunk string) {
		writeSSE(w, f, chunk)
	})
	if err != nil {
		writeSSE(w, f, fmt.Sprintf("[error] %v", err))
		return
	}
	writeSSE(w, f, "[DONE]")
}

func writeSSE(w http.ResponseWriter, f http.Flusher, data string) {
	fmt.Fprintf(w, "data: %s\n\n", data)
	f.Flush()
}
