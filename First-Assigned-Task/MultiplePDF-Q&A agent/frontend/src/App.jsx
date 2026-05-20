import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CitationViewer from './components/CitationViewer';

const API_BASE = 'http://localhost:8001/api';

export default function App() {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Citations inspect states
  const [activeCitation, setActiveCitation] = useState(null);
  const [retrievedSources, setRetrievedSources] = useState([]);

  // Fetch active indexed files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error("Failed to fetch files:", e);
    }
  };

  // Upload PDFs incrementally
  const handleUpload = async (selectedFiles) => {
    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchFiles();
      } else {
        const err = await response.json();
        alert(err.detail || "Upload failed");
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Backend connection failed during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete individual PDF
  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to remove "${filename}" from the agent's knowledge database?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/files/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear active citation drawer if we deleted its source
        if (activeCitation?.filename === filename) {
          setActiveCitation(null);
        }
        await fetchFiles();
      } else {
        const err = await response.json();
        alert(err.detail || "Delete failed");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Send query and process SSE stream
  const handleSend = async () => {
    const textToSend = inputValue.trim();
    if (!textToSend || isLoading) return;

    // Reset citation viewer for new questions
    setActiveCitation(null);
    setRetrievedSources([]);

    // Append user message
    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Server error");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botMessageText = "";
      let sourceMetadataStr = "";
      let isMetadata = false;

      // Add empty bot message bubble
      setMessages((prev) => [...prev, { sender: 'bot', text: '' }]);

      let streamBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          streamBuffer += decoder.decode(value, { stream: !done });
          const lines = streamBuffer.split('\n');
          // Keep the last incomplete line in the buffer
          streamBuffer = lines.pop() || "";
          
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              const data = cleanLine.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.citations) {
                  setRetrievedSources(parsed.citations);
                } else if (parsed.token !== undefined) {
                  botMessageText += parsed.token;
                  
                  // Update live message text
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = botMessageText;
                    return updated;
                  });
                }
              } catch (e) {
                // Fallback for raw text streams
                if (!data.includes('__CITATIONS_METADATA__:')) {
                  botMessageText += data;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = botMessageText;
                    return updated;
                  });
                }
              }
            }
          }
        }
      }

    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Failed to fetch response: ${e.message}. Please verify the backend is running.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (filename, page) => {
    setActiveCitation({ filename, page });
  };

  const handleCloseCitation = () => {
    setActiveCitation(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar with upload functionalities */}
      <Sidebar 
        files={files} 
        onUpload={handleUpload} 
        onDelete={handleDelete}
        isUploading={isUploading}
      />
      
      {/* Chat window */}
      <ChatWindow 
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        isLoading={isLoading}
        onCitationClick={handleCitationClick}
        hasFiles={files.length > 0}
      />

      {/* Slide-out Citation Viewer panel */}
      <CitationViewer 
        activeCitation={activeCitation}
        retrievedSources={retrievedSources}
        onClose={handleCloseCitation}
      />
    </div>
  );
}
