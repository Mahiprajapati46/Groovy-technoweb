import React, { useState, useRef } from 'react';

export default function Sidebar({ files, onUpload, onDelete, isUploading }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onUpload(droppedFiles);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 0) {
        onUpload(selectedFiles);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">Ω</div>
        <span className="logo-text">Aegis Agent</span>
      </div>

      <div 
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt,.md,.json,.xml" 
          className="hidden-file-input"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <div className="dropzone-icon">⭱</div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Drag & Drop Files</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isUploading ? 'Ingesting documents...' : 'or click to browse local files'}
        </p>
      </div>

      <div className="file-list-container">
        <h3 className="section-title">Knowledge Corpus ({files.length})</h3>
        
        {files.length === 0 ? (
          <div style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.8rem', 
            textAlign: 'center', 
            marginTop: '20px', 
            lineHeight: 1.4 
          }}>
            No documents loaded.<br />Upload files to initialize the agent's knowledge database.
          </div>
        ) : (
          files.map((file) => (
            <div key={file.name} className="file-item">
              <div className="file-info">
                <div className="file-icon">🗎</div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="file-name" title={file.name}>{file.name}</div>
                  <div className="file-meta">
                    {file.pages} {file.pages === 1 ? 'unit' : 'units'} • {formatSize(file.size)}
                  </div>
                </div>
              </div>
              <button 
                className="delete-btn" 
                title="Delete File"
                onClick={() => onDelete(file.name)}
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
