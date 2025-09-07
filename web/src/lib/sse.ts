export type OnChunk = (text: string) => void

export async function postSSE(url: string, body: unknown, onChunk: OnChunk): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  await readSSEStream(res.body, onChunk)
}

async function readSSEStream(stream: ReadableStream<Uint8Array>, onChunk: OnChunk) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    buf = processBuffer(buf, onChunk)
  }
  processBuffer(buf, onChunk)
}

function processBuffer(buf: string, onChunk: OnChunk): string {
  const parts = buf.split('\n\n')
  for (let i = 0; i < parts.length - 1; i++) handleEvent(parts[i], onChunk)
  return parts[parts.length - 1]
}

function handleEvent(block: string, onChunk: OnChunk) {
  const lines = block.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)
      onChunk(data)
    }
  }
}

