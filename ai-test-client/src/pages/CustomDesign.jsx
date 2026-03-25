import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingCart, RefreshCw, Loader2, Info } from 'lucide-react';
import { processText } from '../services/api';
import ChatBox from '../components/ChatBox';
import './CustomDesign.css';

const LOADING_STEPS = [
  "Analyzing request...",
  "Selecting flowers...",
  "Matching colors...",
  "Wrapping bouquet...",
  "Calculating price..."
];

export default function CustomDesign() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState(null);

  // AI Thinking Animation effect
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1200);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDesign = async (text) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setShowRaw(false);
    
    try {
      // Simulate slight delay for dramatic effect if it's too fast
      const startTime = Date.now();
      const response = await processText(text);
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setSample = (text) => {
    handleDesign(text);
  };

  // Fake Pricing Calculation
  const calculatePrice = (data) => {
    if (!data) return 0;
    
    // Base flower prices (fake logic)
    const prices = {
      'hồng': 15000,
      'rose': 15000,
      'cẩm chướng': 12000,
      'hướng dương': 20000,
      'baby': 8000,
      'tulip': 25000,
      'default': 10000
    };

    const flowerKey = data.flower ? data.flower.toLowerCase() : 'default';
    let basePrice = 0;
    
    // Find matching price
    for (const [key, price] of Object.entries(prices)) {
      if (flowerKey.includes(key)) {
        basePrice = price;
        break;
      }
    }
    if (basePrice === 0) basePrice = prices['default'];

    const qty = parseInt(data.qty) || 1;
    let total = basePrice * qty;

    // Wrapper fee
    if (data.wrapper) {
      total += 25000;
    }

    return total;
  };

  const renderConfidenceBadge = (conf) => {
    if (!conf) return null;
    const percent = Math.round(conf * 100);
    if (percent > 80) return <span className="conf-badge high">High Confidence ({percent}%)</span>;
    if (percent >= 50) return <span className="conf-badge medium">Medium Confidence ({percent}%)</span>;
    return <span className="conf-badge low">Low Confidence ({percent}%)</span>;
  };

  const renderValue = (val) => val ? val : <span className="not-specified">Not specified</span>;

  return (
    <div className="custom-design-container">
      <header className="cd-header">
        <h1>AI Bouquet Designer</h1>
        <p>Your personal AI florist - describe what you want, and we'll design it.</p>
      </header>

      <div className="cd-layout">
        {/* LEFT COLUMN: Input */}
        <div className="cd-col cd-input-panel">
          <h2>1. Describe your idea</h2>
          <div className="cd-card">
            <ChatBox onSendMessage={handleDesign} isLoading={isLoading} />
            
            <div className="quick-suggestions">
              <p>Quick suggestions:</p>
              <button onClick={() => setSample('1 bó 20 bông hồng đỏ gói giấy báo mộc mạc tặng sinh nhật mẹ')}>
                🎁 Birthday Roses
              </button>
              <button onClick={() => setSample('Thiết kế cho mình giỏ hoa hướng dương rực rỡ tặng thi tốt nghiệp')}>
                🎓 Graduation Sunflowers
              </button>
              <button onClick={() => setSample('Hoa baby trắng mộng mơ gói giấy hồng đục')}>
                ☁️ Dreamy Baby's Breath
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: AI Result */}
        <div className="cd-col cd-result-panel">
          <h2>2. AI Design</h2>
          <div className="cd-card result-container">
            {isLoading ? (
              <div className="ai-thinking-state">
                <div className="spinner-container">
                  <Sparkles className="sparkle-icon spinner" size={48} />
                </div>
                <h3>AI is designing your bouquet...</h3>
                <p className="thinking-step">{LOADING_STEPS[loadingStepIndex]}</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={() => setSample('1 bó hồng đỏ')} className="retry-btn">Try again</button>
              </div>
            ) : result?.data ? (
              <div className="design-details animate-fade-in">
                <div className="design-header">
                  <h3>Floral Composition</h3>
                  {renderConfidenceBadge(result.data.confidence)}
                </div>
                
                <ul className="spec-list">
                  <li>
                    <span className="spec-label">Flower Type</span>
                    <span className="spec-val">{renderValue(result.data.flower)}</span>
                  </li>
                  <li>
                    <span className="spec-label">Quantity</span>
                    <span className="spec-val">{renderValue(result.data.qty)}</span>
                  </li>
                  <li>
                    <span className="spec-label">Color Theme</span>
                    <span className="spec-val">{renderValue(result.data.color)}</span>
                  </li>
                  <li>
                    <span className="spec-label">Wrap Style</span>
                    <span className="spec-val">{renderValue(result.data.wrapper)}</span>
                  </li>
                  <li>
                    <span className="spec-label">Occasion</span>
                    <span className="spec-val">{renderValue(result.data.occasion)}</span>
                  </li>
                </ul>

                <div className="debug-toggle" onClick={() => setShowRaw(!showRaw)}>
                  <Info size={16} />
                  <span>{showRaw ? 'Hide' : 'Show'} AI Raw Data</span>
                </div>
                
                {showRaw && (
                  <div className="raw-data-box">
                    <pre>{JSON.stringify(result.raw, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <Sparkles size={48} className="placeholder-icon" />
                <p>Waiting for your creative input...</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Action */}
        <div className="cd-col cd-action-panel">
          <h2>3. Summary & Action</h2>
          <div className="cd-card action-card">
            {result?.data && !isLoading ? (
              <div className="animate-fade-in">
                <div className="price-display">
                  <span className="price-label">Estimated Price</span>
                  <div className="price-value">
                    {calculatePrice(result.data).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn-primary">
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                  <button className="btn-secondary" onClick={() => setSample('Thiết kế lại mẫu tương tự nhưng màu xanh')}>
                    <RefreshCw size={20} />
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="action-placeholder">
                <p>Design a bouquet first to see pricing and cart options.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
