'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = n => (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
const cc  = n => n > 0.0005 ? 'up' : n < -0.0005 ? 'down' : 'neutral';

function Block({ title, sp, fx, net, loading }) {
  const Skel = ({ w, h }) => <span className="skel" style={{ width: w, height: h, display: 'block', borderRadius: 8 }} />;

  return (
    <div className="block">
      <div className="block-title">{title}</div>

      <div className="trio">
        {/* S&P row */}
        <div className="trio-row">
          <div className="trio-label">S&P 500</div>
          <div className={`trio-val ${sp ? cc(sp.change) : 'neutral'}`}>
            {loading && !sp ? <Skel w={90} h={38} /> : sp ? fmt(sp.change) : '—'}
          </div>
          <div className="trio-sub">{sp ? `${Math.round(sp.first).toLocaleString()} ← ${Math.round(sp.last).toLocaleString()}` : ''}</div>
        </div>

        <div className="divider" />

        {/* FX row */}
        <div className="trio-row">
          <div className="trio-label">דולר / שקל</div>
          <div className={`trio-val ${fx ? cc(fx.change) : 'neutral'}`}>
            {loading && !fx ? <Skel w={90} h={38} /> : fx ? fmt(fx.change) : '—'}
          </div>
          <div className="trio-sub">{fx ? `${fx.first.toFixed(3)} ← ${fx.last.toFixed(3)} ₪` : ''}</div>
        </div>

        <div className="divider" />

        {/* Net row */}
        <div className="trio-row net-row">
          <div className="trio-label">בשקלים נטו</div>
          <div className={`trio-val big ${net !== null && net !== undefined ? cc(net) : 'neutral'}`}>
            {loading && net === null ? <Skel w={120} h={52} /> : net !== null && net !== undefined ? fmt(net) : '—'}
          </div>
          <div className="trio-sub">(1+S&P)×(1+$/₪)−1</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [ts, setTs]         = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/market');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      const now = new Date();
      setTs('עודכן: ' + now.toLocaleTimeString('he-IL') + ' · ' + now.toLocaleDateString('he-IL'));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10*60*1000); return () => clearInterval(iv); }, [load]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,700;1,9..144,300&display=swap');
        :root{--bg:#0a0a0f;--surface:#111118;--border:#1e1e2e;--muted:#3a3a52;--text:#e8e6f0;--sub:#7a7890;--up:#4fffb0;--down:#ff5f7e;--accent:#c8b8ff;--gold:#f5c842;}
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace;min-height:100dvh;}
        .glow{position:fixed;top:-180px;left:50%;transform:translateX(-50%);width:500px;height:500px;background:radial-gradient(ellipse,rgba(200,184,255,0.06) 0%,transparent 70%);pointer-events:none;}
        .wrap{display:flex;flex-direction:column;align-items:center;padding:28px 16px 48px;gap:16px;max-width:440px;margin:0 auto;}
        header{width:100%;}
        .eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--sub);margin-bottom:6px;}
        h1{font-family:'Fraunces',serif;font-size:30px;font-weight:200;line-height:1.1;}
        h1 em{font-style:italic;color:var(--accent);}
        .ts{font-size:11px;color:var(--muted);margin-top:5px;}

        .block{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;position:relative;}
        .block::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,184,255,0.2),transparent);}
        .block-title{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--sub);padding:18px 20px 0;}

        .trio{display:flex;flex-direction:column;}
        .trio-row{padding:16px 20px;}
        .trio-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);margin-bottom:6px;}
        .trio-val{font-family:'Fraunces',serif;font-size:40px;font-weight:700;line-height:1;letter-spacing:-1px;transition:color .4s;}
        .trio-val.big{font-size:56px;letter-spacing:-2px;}
        .trio-val.up{color:var(--up);} .trio-val.down{color:var(--down);} .trio-val.neutral{color:var(--muted);}
        .trio-sub{font-size:10px;color:var(--muted);margin-top:5px;}
        .net-row{background:rgba(255,255,255,0.02);border-top:1px solid var(--border);}

        .divider{height:1px;background:var(--border);margin:0 20px;}

        .btn{width:100%;background:transparent;border:1px solid var(--border);border-radius:12px;padding:14px;color:var(--sub);font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.1em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;}
        .btn:active{background:var(--border);color:var(--text);}
        .btn:disabled{opacity:.4;cursor:not-allowed;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .spinning{animation:spin .9s linear infinite;display:inline-block;}
        .skel{background:linear-gradient(90deg,var(--border) 25%,var(--muted) 50%,var(--border) 75%);background-size:200% 100%;animation:sh 1.5s infinite;}
        @keyframes sh{to{background-position:-200% 0;}}
        .err{color:var(--down);font-size:12px;padding:12px 14px;background:rgba(255,95,126,0.07);border:1px solid rgba(255,95,126,0.15);border-radius:10px;width:100%;line-height:1.7;}
        .note{font-size:10px;color:var(--muted);text-align:center;line-height:1.7;width:100%;}
      `}</style>

      <div className="glow" />
      <div className="wrap">
        <header>
          <div className="eyebrow">תשואה מתואמת מטבע</div>
          <h1>S&P 500 <em>בשקלים</em></h1>
          <div className="ts">{ts || 'טוען...'}</div>
        </header>

        <Block
          title="מתחילת החודש — MTD"
          sp={data?.mtd?.sp}
          fx={data?.mtd?.fx}
          net={data?.mtd?.net ?? null}
          loading={loading}
        />

        <Block
          title="מתחילת השנה — YTD"
          sp={data?.ytd?.sp}
          fx={data?.ytd?.fx}
          net={data?.ytd?.net ?? null}
          loading={loading}
        />

        {error && <div className="err">שגיאה: {error}</div>}

        <button className="btn" onClick={load} disabled={loading}>
          <span className={loading ? 'spinning' : ''}>↻</span> רענן
        </button>

        <div className="note">נתונים: Yahoo Finance · מתרענן כל 10 דקות</div>
      </div>
    </>
  );
}
