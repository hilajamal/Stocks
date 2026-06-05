export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const p1mtd = Math.floor(startOfMonth.getTime() / 1000);
    const p1ytd = Math.floor(startOfYear.getTime()  / 1000);
    const p2    = Math.floor(now.getTime() / 1000);

    async function fetchTicker(ticker, period1) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${period1}&period2=${p2}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }
      });
      if (!res.ok) throw new Error(`Yahoo error ${res.status} for ${ticker}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error(`No data for ${ticker}`);
      const closes =
        result.indicators?.adjclose?.[0]?.adjclose ||
        result.indicators?.quote?.[0]?.close || [];
      const valid = closes.filter(c => c != null);
      if (valid.length < 1) throw new Error(`Empty closes for ${ticker}`);
      return { first: valid[0], last: valid[valid.length - 1] };
    }

    const [spMtd, spYtd, fxMtd, fxYtd] = await Promise.all([
      fetchTicker('^GSPC', p1mtd),
      fetchTicker('^GSPC', p1ytd),
      fetchTicker('ILS=X', p1mtd),
      fetchTicker('ILS=X', p1ytd),
    ]);

    const calc = (a, b) => ({
      first: a.first, last: a.last,
      change: (a.last - a.first) / a.first,
      // fx same last
      fxFirst: b?.first, fxLast: b?.last,
      fxChange: b ? (b.last - b.first) / b.first : null,
    });

    const mtd = {
      sp:  { first: spMtd.first, last: spMtd.last, change: (spMtd.last - spMtd.first) / spMtd.first },
      fx:  { first: fxMtd.first, last: fxMtd.last, change: (fxMtd.last - fxMtd.first) / fxMtd.first },
    };
    mtd.net = (1 + mtd.sp.change) * (1 + mtd.fx.change) - 1;

    const ytd = {
      sp:  { first: spYtd.first, last: spYtd.last, change: (spYtd.last - spYtd.first) / spYtd.first },
      fx:  { first: fxYtd.first, last: fxYtd.last, change: (fxYtd.last - fxYtd.first) / fxYtd.first },
    };
    ytd.net = (1 + ytd.sp.change) * (1 + ytd.fx.change) - 1;

    return Response.json({ mtd, ytd, updatedAt: now.toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
