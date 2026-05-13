import React, { useState } from 'react';
import { uploadPDF } from '../services/api';

export function PDFUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Invalid format. Please select a PDF.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selection required.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPDF(file);
      
      setFile(null);
      onUploadSuccess(result);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'System failure during upload';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.uploadBox}>
        <div 
          style={{
            ...styles.dropZone,
            borderColor: file ? 'var(--success)' : 'var(--border)'
          }}
        >
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            disabled={uploading}
            style={styles.hiddenInput}
            id="pdf-upload-input"
          />
          <label htmlFor="pdf-upload-input" style={styles.label}>
            <span style={{ fontSize: '2rem' }}>{file ? '📄' : '📁'}</span>
            <span style={styles.labelText}>
              {file ? file.name : 'Choose a PDF or drag it here'}
            </span>
          </label>
        </div>

        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          style={{
            ...styles.button,
            opacity: (!file || uploading) ? 0.6 : 1,
            backgroundColor: uploading ? 'var(--text-muted)' : 'var(--primary)'
          }}
        >
          {uploading ? 'Processing...' : 'Upload Document'}
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  uploadBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: '12px',
    padding: '30px 20px',
    textAlign: 'center',
    position: 'relative',
    transition: 'var(--transition)',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  labelText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: 'var(--shadow-sm)',
  },
  error: {
    color: 'var(--error)',
    fontSize: '0.85rem',
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    borderLeft: '4px solid var(--error)',
  },
};
