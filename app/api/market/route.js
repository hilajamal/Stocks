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
      return data.values; // newest first
    }

    function getPrice(values, targetDate) {
      const target = toDateStr(targetDate);
      const reversed = [...values].reverse(); // oldest first
      const found = reversed.find(v => v.datetime >= target);
      return parseFloat(found ? found.close : values[values.length-1].close);
    }

    function getLatest(values) {
      return parseFloat(values[0].close);
    }

    function getYesterday(values) {
      // values[0] = today or latest, values[1] = previous day
      return parseFloat(values[1]?.close ?? values[0].close);
    }

    function getTodayOpen(values) {
      return parseFloat(values[0].open);
    }

    const [spValues, fxValues] = await Promise.all([
      fetchSeries('SPY'),
      fetchSeries('USD/ILS'),
    ]);

    const MULT = 10;

    const spLast      = getLatest(spValues) * MULT;
    const spMtdFirst  = getPrice(spValues, startOfMonth) * MULT;
    const spYtdFirst  = getPrice(spValues, startOfYear) * MULT;
    const spYday      = getYesterday(spValues) * MULT;

    const fxLast      = getLatest(fxValues);
    const fxMtdFirst  = getPrice(fxValues, startOfMonth);
    const fxYtdFirst  = getPrice(fxValues, startOfYear);
    const fxYday      = getYesterday(fxValues);

    const calc = (first, last) => ({ first, last, change: (last - first) / first });

    const today = { sp: calc(spYday, spLast), fx: calc(fxYday, fxLast) };
    today.net = (1 + today.sp.change) * (1 + today.fx.change) - 1;

    const mtd = { sp: calc(spMtdFirst, spLast), fx: calc(fxMtdFirst, fxLast) };
    mtd.net = (1 + mtd.sp.change) * (1 + mtd.fx.change) - 1;

    const ytd = { sp: calc(spYtdFirst, spLast), fx: calc(fxYtdFirst, fxLast) };
    ytd.net = (1 + ytd.sp.change) * (1 + ytd.fx.change) - 1;

    return Response.json({ today, mtd, ytd, updatedAt: now.toISOString() });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
