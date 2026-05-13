import React, { useState } from 'react';
import { PDFUpload } from './components/PDFUpload';
import { QueryInterface } from './components/QueryInterface';
import { CostDisplay } from './components/CostDisplay';
import './App.css';

function App() {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [costTrigger, setCostTrigger] = useState(null);

  const handleUploadSuccess = (data) => {
    setPdfLoaded(true);
    setPdfInfo(data);
  };

  const handleQuery = (queryData) => {
    // Trigger cost update on each query
    setCostTrigger(new Date());
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Ask My Notes</h1>
        <p>Your intelligent document companion. Upload, analyze, and chat with your notes.</p>
      </header>

      <main className="main">
        <aside className="sidebar">
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="section-title">📂 Document Hub</h2>
            <PDFUpload onUploadSuccess={handleUploadSuccess} />
            
            {pdfLoaded && pdfInfo && (
              <div className="card pdf-info-card" style={{ marginTop: '20px' }}>
                <h3>✅ Document Ready</h3>
                <p><strong>File:</strong> {pdfInfo.data?.fileName || pdfInfo.fileName}</p>
                <p><strong>Pages:</strong> {pdfInfo.data?.totalPages || pdfInfo.totalPages}</p>
              </div>
            )}
          </div>

          {pdfLoaded && (
            <div className="cost-section">
              <CostDisplay trigger={costTrigger} />
            </div>
          )}
        </aside>

        <section className="content">
          <div className="card chat-container">
            <QueryInterface pdfLoaded={pdfLoaded} onQuery={handleQuery} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Ask My Notes • Industry Standard Excellence</p>
      </footer>
    </div>
  );
}

export default App;
