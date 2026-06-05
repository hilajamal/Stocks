const AV_KEY = 'TKWBBE4ATLPTE2T0';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    async function fetchSP() {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=full&apikey=${AV_KEY}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data['Note'] || data['Information']) throw new Error('rate_limit');
      const series = data['Time Series (Daily)'];
      if (!series) throw new Error('אין נתוני S&P: ' + JSON.stringify(Object.keys(data)));
      return series;
    }

    async function fetchFX() {
      const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=ILS&outputsize=full&apikey=${AV_KEY}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data['Note'] || data['Information']) throw new Error('rate_limit');
      const series = data['Time Series FX (Daily)'];
      if (!series) throw new Error('אין נתוני FX: ' + JSON.stringify(Object.keys(data)));
      return series;
    }

    function getPrice(series, targetDate) {
      const target = targetDate.toISOString().split('T')[0];
      const dates = Object.keys(series).sort();
      const found = dates.find(d => d >= target);
      const key = found || dates[dates.length - 1];
      return parseFloat(series[key]['4. close']);
    }

    function getLatest(series) {
      const dates = Object.keys(series).sort((a,b) => b.localeCompare(a));
      return parseFloat(series[dates[0]]['4. close']);
    }

    const spSeries = await fetchSP();
    await new Promise(r => setTimeout(r, 2000));
    const fxSeries = await fetchFX();

    const spLast     = getLatest(spSeries);
    const fxLast     = getLatest(fxSeries);
    const spMtdFirst = getPrice(spSeries, startOfMonth);
    const spYtdFirst = getPrice(spSeries, startOfYear);
    const fxMtdFirst = getPrice(fxSeries, startOfMonth);
    const fxYtdFirst = getPrice(fxSeries, startOfYear);

    const calc = (first, last) => ({ first, last, change: (last - first) / first });

    const mtd = { sp: calc(spMtdFirst, spLast), fx: calc(fxMtdFirst, fxLast) };
    mtd.net = (1 + mtd.sp.change) * (1 + mtd.fx.change) - 1;

    const ytd = { sp: calc(spYtdFirst, spLast), fx: calc(fxYtdFirst, fxLast) };
    ytd.net = (1 + ytd.sp.change) * (1 + ytd.fx.change) - 1;

    return Response.json({ mtd, ytd, updatedAt: now.toISOString() });

  } catch (e) {
    const msg = e.message === 'rate_limit'
      ? 'rate limit'
      : e.message;
    return Response.json({ error: msg }, { status: 500 });
  }
}
