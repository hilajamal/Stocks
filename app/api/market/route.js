const TD_KEY = '3b8e7b32ce2842d2ac0359ce6b953ead';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    function toDateStr(d) {
      return d.toISOString().split('T')[0];
    }

    async function fetchSeries(symbol) {
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=365&apikey=${TD_KEY}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);
      return data.values; // array of {datetime, close, ...}
    }

    function getPrice(values, targetDate) {
      const target = toDateStr(targetDate);
      // values are newest first
      const reversed = [...values].reverse(); // oldest first
      const found = reversed.find(v => v.datetime >= target);
      return parseFloat(found ? found.close : values[values.length-1].close);
    }

    function getLatest(values) {
      return parseFloat(values[0].close);
    }

    const [spValues, fxValues] = await Promise.all([
      fetchSeries('SPX'),
      fetchSeries('USD/ILS'),
    ]);

    const spLast     = getLatest(spValues);
    const fxLast     = getLatest(fxValues);
    const spMtdFirst = getPrice(spValues, startOfMonth);
    const spYtdFirst = getPrice(spValues, startOfYear);
    const fxMtdFirst = getPrice(fxValues, startOfMonth);
    const fxYtdFirst = getPrice(fxValues, startOfYear);

    const calc = (first, last) => ({ first, last, change: (last - first) / first });

    const mtd = { sp: calc(spMtdFirst, spLast), fx: calc(fxMtdFirst, fxLast) };
    mtd.net = (1 + mtd.sp.change) * (1 + mtd.fx.change) - 1;

    const ytd = { sp: calc(spYtdFirst, spLast), fx: calc(fxYtdFirst, fxLast) };
    ytd.net = (1 + ytd.sp.change) * (1 + ytd.fx.change) - 1;

    return Response.json({ mtd, ytd, updatedAt: now.toISOString() });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
