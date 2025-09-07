import { postSSE } from '../lib/sse'

export async function sendChat(message: string, onChunk: (c: string) => void) {
  await postSSE('http://localhost:8080/chat', { message }, onChunk)
}

