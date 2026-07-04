export type MarketSnapshot = {
  fetchedAt: string;
  usdInr: { rate: number; delta: number };
  repoRate: number;
  mclr: number;
  gSecTenYear: number;
  idbi: { last: number; deltaPct: number };
  source: "live" | "cached";
};

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const fallback: MarketSnapshot = {
    fetchedAt: new Date().toISOString(),
    usdInr: { rate: 84.32, delta: 0.08 },
    repoRate: 6.5,
    mclr: 9.15,
    gSecTenYear: 6.98,
    idbi: { last: 82.45, deltaPct: 0.62 },
    source: "cached",
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR", {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const json = (await res.json()) as { rates: { INR: number }; date: string };
    return {
      ...fallback,
      fetchedAt: new Date().toISOString(),
      usdInr: { rate: +json.rates.INR.toFixed(2), delta: 0.08 },
      source: "live",
    };
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
