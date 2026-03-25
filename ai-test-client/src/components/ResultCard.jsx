import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResultCard({ result }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!result) return null;

  const { success, data, raw, error } = result;

  if (!success || error) {
    return (
      <div className="result-card error-card">
        <div className="card-header error-header">
          <AlertCircle size={20} />
          <h3>Processing Error</h3>
        </div>
        <div className="card-body">
          <p className="error-message">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const confidencePercent = data?.confidence ? Math.round(data.confidence * 100) : 0;
  
  // Decide color based on confidence
  let confidenceClass = 'conf-high';
  if (confidencePercent < 60) confidenceClass = 'conf-low';
  else if (confidencePercent < 80) confidenceClass = 'conf-medium';

  return (
    <div className="result-card success-card">
      <div className="card-header success-header">
        <div className="header-title">
          <CheckCircle size={20} />
          <h3>Parsed Request</h3>
        </div>
        <div className={`confidence-badge ${confidenceClass}`}>
          Confidence: {confidencePercent}%
        </div>
      </div>
      
      <div className="card-body">
        <div className="parsed-data-grid">
          {data?.flower && (
            <div className="data-item">
              <span className="data-label">Flower:</span>
              <span className="data-value">{data.flower}</span>
            </div>
          )}
          {data?.qty && (
            <div className="data-item">
              <span className="data-label">Quantity:</span>
              <span className="data-value">{data.qty}</span>
            </div>
          )}
          {data?.color && (
            <div className="data-item">
              <span className="data-label">Color:</span>
              <span className="data-value">{data.color}</span>
            </div>
          )}
          {data?.wrapper && (
            <div className="data-item">
              <span className="data-label">Wrapper:</span>
              <span className="data-value">{data.wrapper}</span>
            </div>
          )}
          {data?.occasion && (
            <div className="data-item">
              <span className="data-label">Occasion:</span>
              <span className="data-value">{data.occasion}</span>
            </div>
          )}
          
          {(!data?.flower && !data?.qty && !data?.color && !data?.wrapper && !data?.occasion) && (
            <div className="data-item">
              <span className="data-value text-muted">No entities detected</span>
            </div>
          )}
        </div>
        
        <div className="raw-json-toggle">
          <button 
            type="button" 
            className="toggle-button"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>View Raw JSON</span>
          </button>
        </div>
        
        {showRaw && (
          <div className="raw-json-container">
            <pre className="json-pre">
              {JSON.stringify({ intent: raw?.intent, ner: raw?.ner }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
