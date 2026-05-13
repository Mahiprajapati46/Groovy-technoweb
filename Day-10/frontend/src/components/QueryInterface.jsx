import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export function QueryInterface({ pdfLoaded, onQuery }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleQuery = async () => {
    if (!query.trim() || !pdfLoaded || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/query/ask', { query });
      
      const aiMessage = { 
        role: 'ai', 
        content: response.data.answer,
        tokens: response.data.tokens?.total,
        cost: response.data.cost,
        pages: response.data.pagesSearched
      };
      
      setMessages(prev => [...prev, aiMessage]);
      if (onQuery) onQuery(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Intelligence engine is currently offline');
      setMessages(prev => [...prev, { role: 'error', content: 'Connection failure. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.avatar}>AI</div>
          <div>
            <h2 style={styles.title}>Insight Assistant</h2>
            <span style={styles.status}>{pdfLoaded ? '🟢 Active' : '⚪ Waiting for PDF'}</span>
          </div>
        </div>
      </header>
      
      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h3>Start a conversation</h3>
            <p>Ask anything about your uploaded document.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={{
            ...styles.messageWrapper,
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              ...styles.bubble,
              backgroundColor: msg.role === 'user' ? 'var(--primary)' : '#f1f5f9',
              color: msg.role === 'user' ? 'white' : 'var(--text-main)',
              borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
            }}>
              <p style={styles.messageContent}>{msg.content}</p>
              
              {msg.role === 'ai' && (msg.tokens || msg.cost) && (
                <div style={styles.msgMeta}>
                  <span>🎯 {msg.tokens} tokens</span>
                  <span>💰 ${msg.cost?.toFixed(6)}</span>
                  {msg.pages && <span>📄 {msg.pages} pgs</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={styles.messageWrapper}>
            <div style={{...styles.bubble, backgroundColor: '#f1f5f9', borderRadius: '18px 18px 18px 2px'}}>
              <div style={styles.typing}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={pdfLoaded ? "Type your question..." : "Upload a PDF to start chatting"}
            disabled={!pdfLoaded || loading}
            style={styles.textarea}
          />
          <button 
            onClick={handleQuery}
            disabled={!pdfLoaded || loading || !query.trim()}
            style={styles.sendButton}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--primary)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
  },
  title: {
    fontSize: '1rem',
    margin: 0,
    color: 'var(--text-main)',
  },
  status: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f8fafc',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    opacity: 0.6,
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '16px',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
    animation: 'slideUp 0.3s ease-out',
  },
  bubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    boxShadow: 'var(--shadow-sm)',
    position: 'relative',
  },
  messageContent: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  msgMeta: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '12px',
    fontSize: '0.7rem',
    opacity: 0.7,
    fontWeight: '600',
  },
  inputArea: {
    padding: '20px 24px',
    borderTop: '1px solid var(--border)',
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f1f5f9',
    padding: '8px 12px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
  },
  textarea: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    resize: 'none',
    minHeight: '40px',
    maxHeight: '120px',
    fontSize: '0.95rem',
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    outline: 'none',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    cursor: 'pointer',
  },
  typing: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  error: {
    color: 'var(--error)',
    fontSize: '0.8rem',
    marginTop: '8px',
    textAlign: 'center',
  },
};
