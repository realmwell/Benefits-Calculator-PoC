import { useState, useRef, useEffect } from 'react';
import { Layout } from '../shared/Layout';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; program: string }[];
}

const API_URL = import.meta.env.VITE_CHAT_API_URL || '/api/chat';

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "I can answer questions about DC government benefit programs. For example, you could ask:\n\n" +
        "- \"Am I eligible for SNAP if I make $2,000/month?\"\n" +
        "- \"What is the DC Healthcare Alliance?\"\n" +
        "- \"How do I apply for LIHEAP in DC?\"\n\n" +
        "What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, the chat service is not available right now. This could mean:\n\n' +
            '- The backend has not been deployed yet\n' +
            '- The service has reached its monthly budget cap\n\n' +
            'In the meantime, try the questionnaire to find benefits you may qualify for.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <h1>Ask about DC benefits</h1>
      <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-secondary)' }}>
        Ask questions about DC benefit programs in plain English. Answers are generated using
        official DC government sources.
      </p>

      <div
        style={{
          border: '1px solid var(--color-border)',
          height: '24rem',
          overflowY: 'auto',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          background: 'var(--color-bg-secondary)',
        }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              background: msg.role === 'user' ? 'var(--color-primary-light)' : 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              maxWidth: '85%',
              marginLeft: msg.role === 'user' ? 'auto' : '0',
            }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-text-secondary)' }}>
              {msg.role === 'user' ? 'You' : 'DC Benefits Assistant'}
            </p>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: '1.5' }}>
              {msg.content}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-xs)' }}>
                <strong>Sources:</strong>
                <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                  {msg.sources.map((s, j) => (
                    <li key={j}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.program}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ padding: 'var(--space-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            Searching DC benefits information...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <textarea
          ref={inputRef}
          className="form-input"
          style={{ flex: 1, maxWidth: '100%', resize: 'vertical', minHeight: '44px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          aria-label="Type your question about DC benefits"
          rows={2}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{ alignSelf: 'flex-end' }}
        >
          Send
        </button>
      </div>

      <div className="disclaimer" style={{ marginTop: 'var(--space-lg)' }}>
        <p>
          Answers are generated by AI using official DC government sources. Always verify
          information with the administering agency before making decisions.
        </p>
      </div>
    </Layout>
  );
}
