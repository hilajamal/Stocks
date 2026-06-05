'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = n => (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
const cc  = n => n > 0.0005 ? 'up' : n < -0.0005 ? 'down' : 'neutral';

function StatRow({ label, value, sub, big, loading }) {
  const cls = value !== null ? cc(value) : 'neutral';
  return (
    <div className={`sr ${big ? 'sr-big' : ''}`}>
      <div className="sr-left">
        <span className="sr-label">{label}</span>
        {sub && <span className="sr-sub">{sub}</span>}
      </div>
      <div className={`sr-val ${cls}`}>
        {loading
          ? <span className="skel" style={{width: big?100:72, height: big?36:26, display:'block', borderRadius:6}} />
          : value !== null ? fmt(value) : '—'}
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
      <div className="panel-head"><span className="ptag">{period}</span></div>
      <StatRow label="S&P 500" sub={sp ? `${Math.round(sp.first).toLocaleString()} ← ${Math.round(sp.last).toLocaleString()}` : null} value={sp?.change ?? null} loading={loading} />
      <div className="div" />
      <StatRow label="דולר / שקל" sub={fx ? `${fx.first.toFixed(3)} ← ${fx.last.toFixed(3)} ₪/$` : null} value={fx?.change ?? null} loading={loading} />
      <div className="div div-bold" />
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
      setTs(now.toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}) + ' · ' + now.toLocaleDateString('he-IL'));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10*60*1000); return () => clearInterval(iv); }, [load]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        :root {
          --bg: #0f0f0f;
          --surface: #1a1a1a;
          --surface2: #222;
          --border: #2a2a2a;
          --text: #f0f0f0;
          --sub: #666;
          --up: #3dd68c;
          --down: #f87171;
          --neutral: #555;
          --tag-bg: #2a2a2a;
          --tag-text: #aaa;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        html,body { background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; min-height:100dvh; }

        .page { max-width:400px; margin:0 auto; padding:28px 16px 56px; display:flex; flex-direction:column; gap:10px; }

        .hd { padding-bottom:4px; }
        .hd-eye { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--sub); margin-bottom:10px; }
        .hd-title { font-size:32px; font-weight:700; line-height:1.1; letter-spacing:-0.5px; }
        .hd-title span { color:var(--up); }
        .hd-ts { font-size:11px; color:var(--sub); margin-top:6px; }

        .panel { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
        .panel-head { padding:12px 16px; border-bottom:1px solid var(--border); }
        .ptag { font-size:11px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:var(--tag-text); background:var(--tag-bg); padding:4px 10px; border-radius:20px; }

        .sr { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; gap:8px; }
        .sr-big { padding:16px 16px; background:var(--surface2); }
        .sr-left { display:flex; flex-direction:column; gap:3px; }
        .sr-label { font-size:13px; font-weight:500; color:var(--text); }
        .sr-big .sr-label { font-size:14px; font-weight:600; }
        .sr-sub { font-size:10px; color:var(--sub); }
        .sr-val { font-size:22px; font-weight:700; letter-spacing:-0.3px; flex-shrink:0; transition:color .3s; }
        .sr-big .sr-val { font-size:32px; letter-spacing:-0.5px; }
        .sr-val.up { color:var(--up); }
        .sr-val.down { color:var(--down); }
        .sr-val.neutral { color:var(--neutral); }

        .div { height:1px; background:var(--border); margin:0 16px; }
        .div-bold { margin:0; }

        .btn { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:13px; color:var(--sub); font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .15s; }
        .btn:active { background:var(--border); color:var(--text); }
        .btn:disabled { opacity:.4; cursor:not-allowed; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinning { display:inline-block; animation:spin .9s linear infinite; }

        .skel { background:linear-gradient(90deg,var(--border) 25%,#333 50%,var(--border) 75%); background-size:200% 100%; animation:sh 1.4s infinite; border-radius:6px; }
        @keyframes sh { to { background-position:-200% 0; } }

        .err { background:#2a1515; border:1px solid #5a2020; border-radius:12px; padding:12px 14px; font-size:12px; color:var(--down); line-height:1.6; }
        .note { font-size:10px; color:var(--sub); text-align:center; line-height:1.7; }
      `}</style>

      <div className="page">
        <header className="hd">
          <div className="hd-title">S&P 500</div>
          <div className="hd-ts">{ts ? `עודכן ${ts}` : 'טוען...'}</div>
        </header>

        <Panel period="MTD" data={data?.mtd} loading={loading} />
        <Panel period="YTD"  data={data?.ytd} loading={loading} />

        {error && <div className="err">שגיאה: {error}</div>}

        <button className="btn" onClick={load} disabled={loading}>
          <span className={loading ? 'spinning' : ''}>↻</span> רענן נתונים
        </button>
      </div>
    </>
  );
}
