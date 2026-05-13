import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function CostDisplay({ trigger }) {
  const [costs, setCosts] = useState({
    totalCalls: 0,
    totalTokens: 0,
    estimatedCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCosts();
  }, [trigger]);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/query/costs');
      setCosts(response.data);
    } catch (err) {
      console.error('Telemetry fetch failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all telemetry data?')) return;
    
    try {
      await axios.post('/api/query/costs/reset');
      setCosts({
        totalCalls: 0,
        totalTokens: 0,
        estimatedCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        currency: 'USD'
      });
      fetchCosts();
    } catch (err) {
      console.error('Reset failure:', err);
    }
  };

  return (
    <div className="card" style={styles.container}>
      <header style={styles.header}>
        <h3 style={styles.title}>System Telemetry</h3>
        <div style={styles.indicator}>
          <div style={{...styles.dot, backgroundColor: loading ? 'var(--warning)' : 'var(--success)'}} />
          {loading ? 'Updating...' : 'Live'}
        </div>
      </header>

      <div style={styles.grid}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Usage</span>
          <span style={styles.statValue}>{costs.totalTokens?.toLocaleString() || 0}</span>
          <span style={styles.statUnit}>Tokens</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Investment</span>
          <span style={styles.statValue}>${(costs.estimatedCost || 0).toFixed(6)}</span>
          <span style={styles.statUnit}>{costs.currency || 'USD'}</span>
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span>API Transactions</span>
          <span>{costs.totalCalls || 0}</span>
        </div>
        <div style={styles.detailRow}>
          <span>Input Volume</span>
          <span>{costs.totalInputTokens?.toLocaleString() || 0}</span>
        </div>
        <div style={styles.detailRow}>
          <span>Output Volume</span>
          <span>{costs.totalOutputTokens?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={fetchCosts} style={styles.btnSecondary} disabled={loading}>
          Synchronize
        </button>
        <button onClick={handleReset} style={styles.btnDanger} disabled={loading}>
          Reset Data
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: 'var(--surface)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    padding: '16px',
    backgroundColor: 'var(--background)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-main)',
    fontFamily: 'Outfit, sans-serif',
  },
  statUnit: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
    padding: '16px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  btnSecondary: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  btnDanger: {
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #fee2e2',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--error)',
  },
};
