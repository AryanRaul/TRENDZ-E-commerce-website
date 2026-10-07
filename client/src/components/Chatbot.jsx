import { useState } from 'react';
import './Chatbot.css';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! 👋 I’m the TRENDZ shopping assistant. How can I help you today?'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e?.preventDefault();

    const text = message.trim();

    if (!text || loading) return;

    setMessage('');

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text
      }
    ]);

    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Chatbot request failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message
        }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I’m having trouble connecting right now. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <strong>TRENDZ Assistant</strong>
              <span>AI Shopping Assistant</span>
            </div>

            <button
              type="button"
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`chatbot-message ${item.role}`}
              >
                {item.content}
              </div>
            ))}

            {loading && (
              <div className="chatbot-message assistant chatbot-typing">
                Thinking...
              </div>
            )}
          </div>

          <form className="chatbot-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about outfits, sizes..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chatbot-button ${open ? 'chatbot-button-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open TRENDZ chatbot"
      >
        {open ? '×' : '💬'}
      </button>
    </>
  );
}
