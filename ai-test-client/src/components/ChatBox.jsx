import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatBox({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="chat-box-form">
      <div className="input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập yêu cầu của bạn (VD: Cho mình 1 bó 10 bông hồng tặng sinh nhật)..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </form>
  );
}
