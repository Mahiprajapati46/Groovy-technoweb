import React from 'react';

export default function CitationViewer({ activeCitation, retrievedSources, onClose }) {
  if (!activeCitation) return null;

  const { filename, page } = activeCitation;

  // Filter chunks that match this exact filename and page number
  // Sometimes page numbers are strings ("5", "Page 5", etc.), so we do a flexible match
  const matchingSources = retrievedSources.filter(src => {
    const srcFile = src.file_name || '';
    const srcPage = src.page || '';
    
    // Normalize and strip all spaces/case for resilient matching
    const cleanSrcPage = srcPage.toString().toLowerCase().replace(/\s+/g, '').trim();
    const cleanCitationPage = page.toString().toLowerCase().replace(/\s+/g, '').trim();
    
    return (
      srcFile.toLowerCase().trim() === filename.toLowerCase().trim() &&
      (cleanSrcPage === cleanCitationPage || 
       cleanSrcPage.includes(cleanCitationPage) || 
       cleanCitationPage.includes(cleanSrcPage))
    );
  });

  return (
    <div className="citation-drawer">
      <div className="drawer-header">
        <h3 className="drawer-title">Citation Inspector</h3>
        <button className="close-drawer-btn" onClick={onClose}>×</button>
      </div>

      <div className="drawer-body">
        <div className="source-badge-row" style={{ marginBottom: '10px' }}>
          <span className="source-file-badge">📄 {filename}</span>
          <span className="source-page-badge">📖 Page {page}</span>
        </div>

        {matchingSources.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            No raw text block found matching this page number in recent search memory.
            The model may have synthesized this information from adjacent pages.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Below is the exact text block retrieved from the PDF that the agent analyzed to compile your answer:
            </div>
            {matchingSources.map((source, index) => (
              <div key={index} className="citation-source-card">
                <div className="source-chunk-text">
                  {/* Render the passage text */}
                  {source.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
