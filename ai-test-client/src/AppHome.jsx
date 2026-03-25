import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import ResultCard from './components/ResultCard';
import { processText } from './services/api';

export default function AppHome() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text) => {
    setIsLoading(true);
    
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text,
    };
    
    setHistory((prev) => [newMessage, ...prev]);

    try {
      const response = await processText(text);
      setHistory((prev) => [
        {
          id: Date.now() + 1,
          type: 'bot',
          result: response
        },
        ...prev
      ]);
    } catch (error) {
      setHistory((prev) => [
        {
          id: Date.now() + 1,
          type: 'bot',
          result: { success: false, error: error.message }
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const setSample = (text) => {
    handleSendMessage(text);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Hydrangea Test Client</h1>
        <p>Giao diện kiểm thử hệ thống AI (Intent + NER)</p>
      </header>

      <main className="app-main">
        <div className="sample-buttons">
          <p>Questions to try:</p>
          <div className="btn-group">
            <button onClick={() => setSample('Cho mình 1 bó 10 bông hồng tặng sinh nhật')}>
              Sinh nhật (Hồng)
            </button>
            <button onClick={() => setSample('Tư vấn giúp em mua hoa cẩm chướng giấy lưới màu đỏ')}>
              Cẩm chướng đỏ
            </button>
            <button onClick={() => setSample('Shop ơi báo giá cho mình nha')}>
              Hỏi giá
            </button>
          </div>
        </div>

        <ChatBox onSendMessage={handleSendMessage} isLoading={isLoading} />

        <div className="history-container">
          {history.length === 0 && (
            <div className="empty-state">
              Lịch sử hội thoại sẽ hiển thị ở đây
            </div>
          )}
          
          {history.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.type}`}>
              {msg.type === 'user' ? (
                <div className="user-bubble">
                  {msg.text}
                </div>
              ) : (
                <div className="bot-bubble">
                  <ResultCard result={msg.result} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
