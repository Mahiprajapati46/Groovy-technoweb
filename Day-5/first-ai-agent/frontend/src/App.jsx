import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5001';
const TOKEN_KEY = 'hr_pulse_token';

function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, onLogout, user }) => (
  <div className="sidebar">
    <div className="sidebar-logo">
      <h2 style={{ color: 'var(--primary)', letterSpacing: '-0.5px', fontSize: '1.5rem' }}>HR-Pulse</h2>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '1px' }}>INTELLIGENCE OS</p>
    </div>
    <nav style={{ flex: 1 }}>
      <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        <span style={{ fontSize: '1.2rem' }}>📊</span> <span className="nav-text">Insights</span>
      </div>
      <div className={`nav-item ${activeTab === 'candidates' ? 'active' : ''}`} onClick={() => setActiveTab('candidates')}>
        <span style={{ fontSize: '1.2rem' }}>👥</span> <span className="nav-text">Candidates</span>
      </div>
      <div className={`nav-item ${activeTab === 'agent' ? 'active' : ''}`} onClick={() => setActiveTab('agent')}>
        <span style={{ fontSize: '1.2rem' }}>🤖</span> <span className="nav-text">Agent Center</span>
      </div>
      <div className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
        <span style={{ fontSize: '1.2rem' }}>💼</span> <span className="nav-text">Job Openings</span>
      </div>
    </nav>
    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>
          {user?.email?.charAt(0).toUpperCase() || 'H'}
        </div>
        <div className="nav-text" style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Administrator</p>
        </div>
      </div>
      <button className="secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>Logout</button>
    </div>
  </div>
);

const Dashboard = ({ stats, recentApps }) => (
  <div className="fade-in">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>HR Intelligence</h1>
        <p style={{ color: 'var(--text-dim)' }}>Welcome back. Here's what the agent has found today.</p>
      </div>
      <div className="glass-card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '1rem' }}>
        <span className="pulse"></span>
        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>AGENT ACTIVE</span>
      </div>
    </div>

    {/* Hero Section */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
      <div className="glass-card" style={{ background: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(90deg, transparent, var(--primary-light))', opacity: 0.5 }}></div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.25rem' }}>🤖 AI Agent Insight</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text)', marginBottom: '2rem', maxWidth: '80%' }}>
          Currently monitoring <strong>{stats?.jobCount || 0} active roles</strong>. 
          The agent has identified <strong>{stats?.pendingCount || 0} high-match candidates</strong> ready for your review. 
          The average talent score in your pipeline is <strong>{stats?.avgScore || 0}%</strong>.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1, padding: '1.25rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.pipeline?.analyzed || 0}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NEWLY ANALYZED</div>
          </div>
          <div style={{ flex: 1, padding: '1.25rem', background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>{stats.pipeline?.shortlisted || 0}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AGENT SHORTLISTED</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card stat-card">
          <div className="stat-label">Total Resumes</div>
          <div className="stat-value">{stats.appCount || 0}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Hire Invites Sent</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.sentCount || 0}</div>
        </div>
      </div>
    </div>

    {/* Mid Section */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Pipeline Performance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { label: 'Applied', count: stats.pipeline?.total || 0, color: '#94a3b8' },
            { label: 'Analyzed', count: stats.pipeline?.analyzed || 0, color: 'var(--accent)' },
            { label: 'Shortlisted', count: stats.pipeline?.shortlisted || 0, color: 'var(--primary)' },
            { label: 'Invited', count: stats.pipeline?.invited || 0, color: 'var(--success)' }
          ].map((step, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-dim)' }}>{step.label}</span>
                <span>{step.count}</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(step.count / (stats.appCount || 1)) * 100}%`, 
                  background: step.color,
                  transition: 'width 1s ease-out',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>🏆 Top Talent Picks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stats.topCandidates?.length > 0 ? stats.topCandidates.map((c, i) => (
            <div key={i} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid var(--card-border)', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.candidateName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{c.job?.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{c.candidateEmail}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{c.analysis.overallScore}%</div>
                <span className={`badge badge-${c.status === 'pending_send' ? 'hire' : c.status === 'sent' ? 'sent' : 'review'}`} style={{ fontSize: '0.65rem' }}>{c.status.replace('_', ' ')}</span>
              </div>
            </div>
          )) : <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem 0' }}>No top candidates identified yet.</div>}
        </div>
      </div>
    </div>

    {/* Bottom: Recent Activity */}
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Live Application Feed</h3>
        <button className="secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>View All</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Candidate</th>
            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Score</th>
            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {recentApps.map((app, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
              <td style={{ padding: '1rem 1.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{app.candidateName || 'Analyzing...'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{app.job?.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{app.candidateEmail}</div>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span className={`badge badge-${app.status === 'pending_send' ? 'hire' : app.status === 'sent' ? 'sent' : 'review'}`}>{app.status.replace('_', ' ')}</span>
              </td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {app.analysis?.overallScore ? `${app.analysis.overallScore}%` : '--'}
              </td>
              <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CandidateCenter = ({ apps, jobs, onUpload, onAddManual, onSendInvite, onDelete, loading }) => {
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload', 'manual', 'bulk'
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState('');
  const [viewingApp, setViewingApp] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    
    try {
      if (mode === 'bulk') {
        if (!selectedJob) return alert("Please select a Target Job for this bulk upload.");
        if (files.length === 0) return;
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('resumes', f));
        formData.append('jobId', selectedJob);
        
        const res = await fetch(`${API_BASE}/api/applications/bulk-upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk upload failed");
        
        setFiles([]);
        alert(`Bulk upload complete! Success: ${data.success}, Failed: ${data.failed}`);
      } else if (mode === 'upload') {
        if (!selectedJob) return alert("Please select a Target Job for this candidate.");
        if (!email || files.length === 0) return;
        await onUpload(email, files[0], selectedJob);
      } else {
        if (!selectedJob) return alert("Please select a Target Job for this candidate.");
        if (!email || !resumeText) return;
        await onAddManual(email, resumeText, selectedJob);
      }
      setEmail('');
      setFiles([]);
      setResumeText('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredApps = apps.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const jobId = a.job?._id || a.job;
    const matchJob = jobFilter === 'all' || jobId === jobFilter;
    return matchStatus && matchJob;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Talent Intelligence</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', background: 'white', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'pending_send', label: 'Qualified' },
                { id: 'sent', label: 'Interviewing' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{ 
                    padding: '0.4rem 1rem', 
                    fontSize: '0.75rem', 
                    background: statusFilter === f.id ? 'var(--primary)' : 'transparent',
                    color: statusFilter === f.id ? 'white' : 'var(--text-dim)',
                    boxShadow: 'none',
                    transform: 'none'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select 
              value={jobFilter} 
              onChange={e => setJobFilter(e.target.value)}
              style={{ width: '200px', fontSize: '0.8rem' }}
            >
              <option value="all">All Job Openings</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', width: '440px', marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.6rem' }}>
            {['upload', 'bulk', 'manual'].map(m => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                style={{ 
                  flex: 1, fontSize: '0.7rem', padding: '0.4rem',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--primary)' : 'var(--text-dim)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                  transform: 'none',
                  border: mode === m ? '1px solid var(--card-border)' : 'none'
                }}
              >
                {m === 'upload' ? 'Single PDF' : m === 'bulk' ? 'Bulk PDFs' : 'Text Paste'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mode !== 'bulk' && (
              <input type="email" placeholder="Candidate Email" value={email} onChange={e => setEmail(e.target.value)} style={{ fontSize: '0.85rem' }} required />
            )}
            
            {mode === 'bulk' || mode === 'upload' ? (
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  multiple={mode === 'bulk'}
                  onChange={e => setFiles(e.target.files)} 
                  style={{ fontSize: '0.85rem', padding: '0.6rem' }} 
                  required 
                />
              </div>
            ) : (
              <textarea placeholder="Paste resume content here..." value={resumeText} onChange={e => setResumeText(e.target.value)} style={{ height: '100px', fontSize: '0.85rem' }} required />
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select 
                value={selectedJob} 
                onChange={e => setSelectedJob(e.target.value)} 
                style={{ flex: 1.5, fontSize: '0.85rem', borderColor: !selectedJob ? 'var(--warning)' : 'var(--card-border)' }}
                required
              >
                <option value="">Select Target Job *</option>
                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
              </select>
              <button type="submit" disabled={loading} style={{ flex: 1, fontSize: '0.85rem' }}>
                {loading ? 'Processing...' : 'Analyze'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredApps.map((app) => (
          <div key={app._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>{app.candidateName || 'Analyzing...'}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.1rem' }}>{app.job?.title}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{app.candidateEmail}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{app.analysis?.overallScore || 0}%</div>
                  <span className={`badge badge-${app.status === 'pending_send' ? 'hire' : app.status === 'sent' ? 'sent' : 'review'}`} style={{ fontSize: '0.6rem' }}>{app.status.replace('_', ' ')}</span>
                </div>
              </div>

              {app.emailDraft && (
                <div style={{ padding: '1rem', background: app.status === 'rejected' ? '#fef2f2' : 'var(--primary-light)', borderRadius: '0.75rem', borderLeft: `4px solid ${app.status === 'rejected' ? 'var(--error)' : 'var(--primary)'}`, marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: app.status === 'rejected' ? 'var(--error)' : 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Agent Insight</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
                    "{app.emailDraft}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => setViewingApp(app)}>View Profile</button>
              {app.status === 'pending_send' && (
                <button style={{ flex: 1, fontSize: '0.8rem', background: 'var(--success)' }} onClick={() => onSendInvite(app._id)}>Send Invite</button>
              )}
              <button className="secondary" style={{ flex: 0.2, color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => onDelete(app._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {viewingApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="fade-in glass-card" style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>{viewingApp.candidateName}</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className={`badge badge-${viewingApp.status === 'pending_send' ? 'hire' : viewingApp.status === 'sent' ? 'sent' : 'review'}`}>{viewingApp.status.replace('_', ' ')}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>{viewingApp.job?.title}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{viewingApp.candidateEmail}</span>
                </div>
              </div>
              <button className="secondary" onClick={() => setViewingApp(null)} style={{ padding: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✕</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem' }}>
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '1rem' }}>Executive Talent Scorecard</h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{viewingApp.analysis?.overallScore}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dim)' }}>/ 100</span>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: '1.7', fontWeight: 500 }}>{viewingApp.analysis?.summary}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--success)' }}>Strengths</h4>
                    <ul style={{ fontSize: '0.85rem', color: 'var(--text)', listStyle: 'none' }}>
                      {viewingApp.analysis?.pros.map((p, i) => <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}><span>✓</span> {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--error)' }}>Potential Gaps</h4>
                    <ul style={{ fontSize: '0.85rem', color: 'var(--text)', listStyle: 'none' }}>
                      {viewingApp.analysis?.cons.map((c, i) => <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}><span>⚠</span> {c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="glass-card" style={{ background: '#f8fafc', border: '1px solid var(--card-border)' }}>
                <h4 style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>Generated Invitation</h4>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Subject</label>
                    <input 
                      value={viewingApp.emailSubject} 
                      onChange={e => {
                        const newApp = {...viewingApp, emailSubject: e.target.value};
                        setViewingApp(newApp);
                      }}
                      style={{ padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.25rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Message Body</label>
                    <textarea 
                      value={viewingApp.emailDraft} 
                      onChange={e => {
                        const newApp = {...viewingApp, emailDraft: e.target.value};
                        setViewingApp(newApp);
                      }}
                      style={{ height: '180px', fontSize: '0.85rem', lineHeight: '1.6', marginTop: '0.25rem' }} 
                    />
                  </div>
                </div>
                <button 
                  style={{ width: '100%', background: 'var(--primary)', padding: '1rem' }} 
                  disabled={viewingApp.status === 'sent'}
                  onClick={() => { onSendInvite(viewingApp._id, viewingApp.emailSubject, viewingApp.emailDraft); setViewingApp(null); }}
                >
                  {viewingApp.status === 'sent' ? '✓ Invitation Sent' : 'Approve & Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AgentCenter = ({ runs, onRunAgent, runLoading, jobs }) => {
  const [selectedJob, setSelectedJob] = useState('');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Autonomous Operations</h1>
          <p style={{ color: 'var(--text-dim)' }}>The HR Agent is auditing your pipeline for top-tier talent.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="secondary" 
            style={{ color: 'var(--text-dim)', fontSize: '0.8rem', border: 'none' }}
            onClick={async () => {
              if (!window.confirm("Wipe all agent logs?")) return;
              await fetch(`${API_BASE}/api/agent/runs`, { method: 'DELETE', headers: authHeaders(localStorage.getItem(TOKEN_KEY)) });
              window.location.reload(); // Quick refresh to clear state
            }}
          >
            🗑️ Clear History
          </button>
          <select 
            value={selectedJob} 
            onChange={e => setSelectedJob(e.target.value)}
            style={{ width: '220px', fontSize: '0.9rem' }}
          >
            <option value="">Global Pipeline Audit</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
          <button 
            onClick={() => onRunAgent(selectedJob)} 
            disabled={runLoading}
            style={{ padding: '0.75rem 2rem' }}
          >
            {runLoading ? <span className="agent-thinking">Agent Thinking...</span> : "🚀 Deploy Agent"}
          </button>
        </div>
      </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="pulse"></div>
          <h3 style={{ fontSize: '1rem' }}>Live Intelligence Feed</h3>
        </div>
        <div style={{ height: '450px', overflowY: 'auto', background: '#0f172a', padding: '1.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
          {runs[0]?.logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '0.75rem', color: '#94a3b8' }}>
              <span style={{ color: 'var(--accent)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span style={{ color: log.level === 'error' ? 'var(--error)' : log.level === 'warn' ? 'var(--warning)' : '#e2e8f0' }}>
                {log.message}
              </span>
            </div>
          )) || <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '5rem' }}>Agent is currently idle.</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Autonomous Decisions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {runs[0]?.results?.actionsTaken?.map((action, i) => (
              <div key={i} style={{ padding: '1rem', background: 'var(--primary-light)', borderLeft: '4px solid var(--primary)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                {action}
              </div>
            )) || <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No recent actions.</div>}
          </div>
        </div>
        
        <div className="glass-card" style={{ background: '#ecfdf5', border: '1px solid #10b981' }}>
          <h4 style={{ color: '#065f46', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Agent Efficiency Mode</h4>
          <p style={{ fontSize: '0.8rem', color: '#065f46', opacity: 0.8 }}>
            Currently in <strong>Draft Mode</strong>. The agent will prepare invitation drafts for high-match candidates but will not send them without your manual approval.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

const JobManagement = ({ jobs, onCreateJob, onShortlist, onDelete, loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateJob({ title, description, requiredSkills: skills.split(',').map(s => s.trim()) });
    setTitle('');
    setDescription('');
    setSkills('');
    setIsModalOpen(false);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Job Openings</h1>
          <p style={{ color: 'var(--text-dim)' }}>Define your hiring requirements to guide the AI Agent.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: '0.75rem 1.5rem' }}>
          + Create New Role
        </button>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="fade-in glass-card" style={{ width: '600px', background: 'white', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>New Job Opening</h2>
              <button className="secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Job Title</label>
                <input placeholder="e.g. Senior React Developer" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Job Description</label>
                <textarea 
                  placeholder="Detailed responsibilities, requirements, and benefits..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={{ height: '150px', fontSize: '0.9rem', lineHeight: '1.6' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Required Skills (Comma separated)</label>
                <input placeholder="React, Node.js, TypeScript, etc." value={skills} onChange={e => setSkills(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ flex: 1 }}>{loading ? 'Creating...' : 'Publish Job Opening'}</button>
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 0.5 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {jobs.map((job) => (
          <div key={job._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{job.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.25rem' }}>
                    👥 {job.appCount || 0} Candidates Applied
                  </div>
                </div>
                <span className={`badge ${job.isActive ? 'badge-hire' : 'badge-reject'}`}>
                  {job.isActive ? 'Active' : 'Closed'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {job.requiredSkills.map((s, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: '#f1f5f9', color: 'var(--text-dim)', borderRadius: '0.5rem', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="secondary" 
                style={{ flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
                onClick={() => onShortlist(job._id)}
              >
                🤖 Analyze Candidates
              </button>
              <button 
                className="secondary" 
                style={{ flex: 0.3, color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={() => onDelete(job._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data
  const [stats, setStats] = useState({});
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);

  // Auth logic
  const [loginEmail, setLoginEmail] = useState('hr@hrpulse.local');
  const [loginPassword, setLoginPassword] = useState('hrpulse123');
  const [loginError, setLoginError] = useState('');

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setMe(null);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [sRes, aRes, rRes, jRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`, { headers: authHeaders(token) }),
        fetch(`${API_BASE}/api/applications`, { headers: authHeaders(token) }),
        fetch(`${API_BASE}/api/agent/runs`, { headers: authHeaders(token) }),
        fetch(`${API_BASE}/api/jobs`, { headers: authHeaders(token) })
      ]);
      
      if (sRes.status === 401) return logout();
      
      const sData = await sRes.json();
      const aData = await aRes.json();
      const rData = await rRes.json();
      const jData = await jRes.json();
      
      setStats(sData);
      setApps(aData);
      setRuns(rData);
      setJobs(jData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders(token) })
        .then(res => res.json())
        .then(data => setMe(data))
        .catch(() => logout());
      
      fetchData();
      const interval = setInterval(fetchData, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [token, logout, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleUpload = async (email, file, jobId) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('resume', file);
    if (jobId) formData.append('jobId', jobId);

    try {
      const res = await fetch(`${API_BASE}/api/applications/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async (email, resumeText, jobId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ email, resumeText, jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add application");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (appId, emailSubject, emailDraft) => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/${appId}/send`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ emailSubject, emailDraft })
      });
      if (!res.ok) throw new Error("Failed to send invite");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShortlist = async (jobId) => {
    setAgentLoading(true);
    setActiveTab('agent'); // Switch to agent view to see progress
    try {
      const res = await fetch(`${API_BASE}/api/agent/run`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ jobId })
      });
      if (!res.ok) throw new Error("Agent failed to start for this job");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setTimeout(() => setAgentLoading(false), 3000);
    }
  };

  const handleCreateJob = async (jobData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(jobData)
      });
      if (!res.ok) throw new Error("Failed to create job");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAgent = async (jobId) => {
    setAgentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/run`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ jobId, task: jobId ? "Job-Specific Audit" : "Global Pipeline Optimization" })
      });
      if (!res.ok) throw new Error("Agent failed to deploy");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setTimeout(() => setAgentLoading(false), 3000);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure? This will delete the job and all its candidates.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      });
      if (!res.ok) throw new Error("Failed to delete job");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteApp = async (appId) => {
    if (!window.confirm("Delete this candidate permanently?")) return;
    try {
      console.log(`[UI] Requesting delete for app: ${appId}`);
      const res = await fetch(`${API_BASE}/api/applications/${appId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      });
      if (!res.ok) throw new Error("Failed to delete application");
      console.log(`[UI] Delete successful for app: ${appId}`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="fade-in glass-card" style={{ maxWidth: '440px', width: '100%', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>HR-Pulse</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Enterprise Talent Intelligence OS</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="hr@company.com" required />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {loginError && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>{loginError}</p>}
            <button style={{ width: '100%', padding: '1rem' }}>Sign In to Workspace</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Protected by HR-Pulse Autonomous Security
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} user={me} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard stats={stats} recentApps={stats.recentApps || []} />}
        {activeTab === 'candidates' && <CandidateCenter apps={apps} jobs={jobs} onUpload={handleUpload} onAddManual={handleAddManual} onSendInvite={handleSendInvite} onDelete={handleDeleteApp} loading={loading} />}
        {activeTab === 'agent' && <AgentCenter runs={runs} onRunAgent={runAgent} runLoading={agentLoading} jobs={jobs} />}
        {activeTab === 'jobs' && <JobManagement jobs={jobs} onCreateJob={handleCreateJob} onShortlist={handleShortlist} onDelete={handleDeleteJob} loading={loading} />}
      </main>
    </div>
  );
}

export default App;
