import React from 'react';

export default function Message({ msg, onCitationClick }) {
  const isUser = msg.sender === 'user';
  
  // Custom citation parser that maps "[Source: filename.pdf, Page: X]" to clickable badges
  const parseCitations = (text) => {
    if (!text) return '';
    
    // Find all citations matching [Source: filename.pdf, Page: X] or [Citation: filename.pdf, Page: X]
    const citationRegex = /(\[(?:Source|Citation):\s*[^\]]+\])/gi;
    const parts = text.split(citationRegex);
    
    if (parts.length === 1) {
      return <span>{renderMarkdown(text)}</span>;
    }
    
    return parts.map((part, index) => {
      if (part.match(citationRegex)) {
        // Extract inner details. Format could be:
        // [Source: planets.pdf, Page: 12] or [Source: planets.pdf, Page: 12; moon.pdf, Page: 4]
        const cleanContent = part.replace(/^\[(?:Source|Citation):\s*/i, '').replace(/\]$/, '');
        const sources = cleanContent.split(';');
        
        return (
          <span key={index} style={{ display: 'inline-flex', gap: '4px' }}>
            {sources.map((src, srcIdx) => {
              // Parse individual: "planets.pdf, Page: 12" or "planets.pdf, Page 12"
              const match = src.trim().match(/(.*?),\s*Page:\s*(.*)/);
              if (match) {
                const filename = match[1].trim();
                const page = match[2].trim();
                
                return (
                  <button 
                    key={srcIdx}
                    className="citation-badge"
                    onClick={() => onCitationClick(filename, page)}
                  >
                    🛈 {filename} (p. {page})
                  </button>
                );
              }
              return <span key={srcIdx} className="citation-badge">{src.trim()}</span>;
            })}
          </span>
        );
      }
      // Render simple inline markdown formatting for non-citation text
      return <span key={index}>{renderMarkdown(part)}</span>;
    });
  };

  // Zero-dependency inline bold and list-bullet markdown parser
  const renderMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    
    return lines.map((line, lineIdx) => {
      let formattedLine = line;
      const bulletRegex = /^(\s*)[*-]\s+(.*)$/;
      const match = line.match(bulletRegex);
      
      let prefix = '';
      if (match) {
        const indentSpaces = match[1] || '';
        const bulletChar = indentSpaces.length > 0 ? '◦' : '•';
        prefix = indentSpaces + bulletChar + ' ';
        formattedLine = match[2];
      }
      
      const boldRegex = /(\*\*[^*]+\*\*)/g;
      const parts = formattedLine.split(boldRegex);
      
      const parsedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      
      return (
        <div key={lineIdx} style={{ minHeight: line === '' ? '12px' : 'auto' }}>
          {prefix}{parsedParts}
        </div>
      );
    });
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
      <div className="message-sender">{isUser ? 'You' : 'Aegis Agent'}</div>
      <div className="message-bubble">
        {isUser ? <span>{renderMarkdown(msg.text)}</span> : parseCitations(msg.text)}
      </div>
      {!isUser && msg.token_usage && (
        <div className="message-token-usage">
          ⚡ Tokens: {msg.token_usage.total_tokens} (Prompt: {msg.token_usage.prompt_tokens} | Completion: {msg.token_usage.completion_tokens})
        </div>
      )}
    </div>
  );
}

