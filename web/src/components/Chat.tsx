import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendChat } from '../api/chat'

type Msg = { role: 'user' | 'assistant'; text: string }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: (prompt: string) => sendMessage(prompt),
  })

  function sendMessage(prompt: string) {
    addUserMessage(prompt)
    startAssistant()
    return sendChat(prompt, onChunk)
  }

  function addUserMessage(text: string) {
    setMessages((m) => [...m, { role: 'user', text }])
  }

  function startAssistant() {
    setMessages((m) => [...m, { role: 'assistant', text: '' }])
  }

  function onChunk(chunk: string) {
    if (chunk === '[DONE]') return
    setMessages((m) => updateLastAssistant(m, chunk))
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }

  function updateLastAssistant(m: Msg[], chunk: string): Msg[] {
    const copy = [...m]
    for (let i = copy.length - 1; i >= 0; i--) {
      if (copy[i].role === 'assistant') {
        copy[i] = { role: 'assistant', text: copy[i].text + chunk }
        break
      }
    }
    return copy
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const q = input
    setInput('')
    mutation.mutate(q)
  }

  const isSending = mutation.isPending
  const placeholder = useMemo(() => (isSending ? 'Streaming…' : 'Ask anything'), [isSending])

  return (
    <div className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold">LLM MCP Chat</h1>
      </header>
      <main ref={listRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
      </main>
      <form onSubmit={onSubmit} className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isSending}
          />
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            disabled={isSending}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user'
  const base = 'max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap'
  const user = 'bg-indigo-600 text-white self-end ml-auto'
  const asst = 'bg-gray-100 text-gray-900 self-start'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${base} ${isUser ? user : asst}`}>{text || '▌'}</div>
    </div>
  )
}

