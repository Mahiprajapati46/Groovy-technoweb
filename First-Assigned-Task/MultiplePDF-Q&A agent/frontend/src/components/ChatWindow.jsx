import React, { useRef, useEffect } from 'react';
import Message from './Message';

export default function ChatWindow({ 
  messages, 
  inputValue, 
  onInputChange, 
  onSend, 
  isLoading, 
  onCitationClick,
  hasFiles
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            PDF Q&A Agent
          </h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-purple)' }}>
            LlamaIndex RRF Hybrid Search Engine <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>•</span> Ω Engine Active
          </p>
        </div>
        <div className="header-status">
          <div className={`status-dot ${isLoading ? 'loading' : ''}`}></div>
          <span>{isLoading ? 'Thinking...' : 'Agent Idle'}</span>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="logo-icon" style={{ width: '60px', height: '60px', fontSize: '2rem', marginBottom: '8px' }}>
              Ω
            </div>
            <h1 className="welcome-title">Aegis Intelligence RAG Agent</h1>
            <p className="welcome-desc">
              An advanced AI agent that processes multiple PDFs of different topics and sizes page-by-page. 
              Upload documents in the sidebar to chat and retrieve precise page citations instantly.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h4>Hybrid BM25 Retrieval</h4>
                <p>Combines exact keyword indexing and semantic embeddings for near-100% search recall.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h4>Gemini LLM Reranking</h4>
                <p>Reranks raw passages dynamically using an LLM to deliver contextually rich and accurate answers.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📖</div>
                <h4>Clickable Page Citations</h4>
                <p>Click citations to open the inspector drawer and view raw highlights from the original PDF.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💾</div>
                <h4>Persistent Ingest</h4>
                <p>PDF storage is indexed incrementally on-disk, allowing you to reload instantly across sessions.</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <Message 
              key={index} 
              msg={msg} 
              onCitationClick={onCitationClick} 
            />
          ))
        )}

        {isLoading && messages[messages.length - 1]?.sender === 'user' && (
          <div className="message-wrapper bot">
            <div className="message-sender">Aegis Agent</div>
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-container">
          <input 
            type="text" 
            className="chat-input"
            placeholder={
              !hasFiles 
                ? "Upload a PDF in the sidebar first to enable the input..." 
                : "Ask anything about the uploaded documents..."
            }
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading || !hasFiles}
          />
          <button 
            className="send-btn"
            onClick={onSend}
            disabled={isLoading || !inputValue.trim() || !hasFiles}
          >
            ➔
          </button>
        </div>
      </div>
    </div>
  );
}
