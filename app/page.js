'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = n => (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
const cc  = n => n > 0.0005 ? 'up' : n < -0.0005 ? 'down' : 'neutral';

function StatRow({ label, value, sub, big, loading }) {
  const cls = value !== null ? cc(value) : 'neutral';
  return (
    <div className={`stat-row ${big ? 'stat-big' : ''}`}>
      <div className="stat-left">
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
      <div className={`stat-val ${cls}`}>
        {loading ? <span className="skel" style={{width: big ? 110 : 80, height: big ? 44 : 32, display:'block', borderRadius:6}} /> : value !== null ? fmt(value) : '—'}
      </div>
    </div>
  );
}

function Panel({ period, data, loading }) {
  const sp  = data?.sp ?? null;
  const fx  = data?.fx ?? null;
  const net = data?.net ?? null;
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">{period}</span>
      </div>
      <StatRow label="S&P 500" sub={sp ? `${Math.round(sp.first).toLocaleString()} ← ${Math.round(sp.last).toLocaleString()}` : null} value={sp?.change ?? null} loading={loading} />
      <div className="sep" />
      <StatRow label="דולר ← שקל" sub={sp ? `${fx?.first?.toFixed(3)} ← ${fx?.last?.toFixed(3)} ₪` : null} value={fx?.change ?? null} loading={loading} />
      <div className="sep sep-thick" />
      <StatRow label="בשקלים נטו" value={net} loading={loading} big />
    </div>
  );
}

export default function Home() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [ts, setTs]           = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/market');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      const now = new Date();
      setTs(now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) + ' · ' + now.toLocaleDateString('he-IL'));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10*60*1000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
        
        :root {
          --bg: #f5f2eb;
          --ink: #1a1a1a;
          --ink2: #555;
          --ink3: #999;
          --card: #ffffff;
          --border: #e0dbd0;
          --up: #1a6b3a;
          --up-bg: #e8f5ee;
          --down: #c0392b;
          --down-bg: #fdf0ee;
          --neutral: #888;
          --accent: #1a1a1a;
          --tag-bg: #1a1a1a;
          --tag-fg: #f5f2eb;
        }

        * { margin:0; padding:0; box-sizing:border-box; }
        html, body {
          background: var(--bg);
          color: var(--ink);
          font-family: 'Space Mono', monospace;
          min-height: 100dvh;
        }

        .page {
          max-width: 420px;
          margin: 0 auto;
          padding: 32px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Header */
        .hd { margin-bottom: 8px; }
        .hd-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink3);
          margin-bottom: 8px;
        }
        .hd-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1px;
          color: var(--ink);
        }
        .hd-title em {
          font-style: normal;
          position: relative;
          display: inline-block;
        }
        .hd-title em::after {
          content: '';
          position: absolute;
          bottom: 2px; left: 0; right: 0;
          height: 3px;
          background: var(--ink);
          border-radius: 2px;
        }
        .hd-ts {
          font-size: 11px;
          color: var(--ink3);
          margin-top: 8px;
          font-family: 'Space Mono', monospace;
        }

        /* Panel */
        .panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .panel-header {
          padding: 14px 20px 10px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: var(--tag-bg);
          color: var(--tag-fg);
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* Stat rows */
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          gap: 12px;
        }
        .stat-big { padding: 18px 20px; background: #fafaf8; }
        .stat-left {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .stat-label {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.01em;
        }
        .stat-sub {
          font-size: 10px;
          color: var(--ink3);
          font-family: 'Space Mono', monospace;
        }
        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.3s;
        }
        .stat-big .stat-val { font-size: 40px; letter-spacing: -1px; }
        .stat-big .stat-label { font-size: 15px; }

        .stat-val.up   { color: var(--up); }
        .stat-val.down { color: var(--down); }
        .stat-val.neutral { color: var(--neutral); }

        .sep { height: 1px; background: var(--border); margin: 0 20px; }
        .sep-thick { height: 1px; background: var(--border); margin: 0; }

        /* Refresh */
        .refresh {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh:active { background: var(--border); }
        .refresh:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }

        /* Skeleton */
        .skel {
          background: linear-gradient(90deg, #ede9e0 25%, #ddd9d0 50%, #ede9e0 75%);
          background-size: 200% 100%;
          animation: sk 1.4s infinite;
          border-radius: 6px;
        }
        @keyframes sk { to { background-position: -200% 0; } }

        /* Error */
        .err {
          background: #fdf0ee;
          border: 1px solid #f5c6c0;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 12px;
          color: var(--down);
          line-height: 1.6;
        }

        .note {
          font-size: 10px;
          color: var(--ink3);
          text-align: center;
          line-height: 1.7;
          font-family: 'Space Mono', monospace;
        }
      `}</style>

      <div className="page">
        <header className="hd">
          <div className="hd-eyebrow">תשואה מתואמת מטבע</div>
          <div className="hd-title">S&P 500<br /><em>בשקלים</em></div>
          <div className="hd-ts">{ts ? `עודכן ${ts}` : 'טוען...'}</div>
        </header>

        <Panel period="MTD — מתחילת החודש" data={data?.mtd} loading={loading} />
        <Panel period="YTD — מתחילת השנה"  data={data?.ytd} loading={loading} />

        {error && <div className="err">שגיאה: {error}</div>}

        <button className="refresh" onClick={load} disabled={loading}>
          <span className={loading ? 'spin' : ''}>↻</span>
          רענן נתונים
        </button>

        <div className="note">Twelve Data · מתרענן כל 10 דקות</div>
      </div>
    </>
  );
}
