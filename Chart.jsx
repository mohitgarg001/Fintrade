import { useEffect, useMemo, useRef, useState } from "react";

const periods = [
  { label: "1M", interval: "1m" },
  { label: "5M", interval: "5m" },
  { label: "15M", interval: "15m" },
  { label: "1H", interval: "1h" },
  { label: "4H", interval: "4h" },
  { label: "1D", interval: "1d" },
];

const BINANCE_REST = "https://data-api.binance.vision/api/v3/klines";
const BINANCE_WS = "wss://data-stream.binance.vision:443/ws";

function Chart({ asset, onPriceUpdate }) {
  const [timeframe, setTimeframe] = useState(periods[3]);
  const [candles, setCandles] = useState([]);
  const [livePrice, setLivePrice] = useState(asset.price);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const wsRef = useRef(null);

  const isCrypto = Boolean(asset.binanceSymbol);

  useEffect(() => {
    setTimeframe(periods[3]);
  }, [asset.symbol]);

  useEffect(() => {
    let cancelled = false;
    let ws;

    const loadMarketData = async () => {
      setLoading(true);
      setError("");
      setCandles([]);
      setLivePrice(asset.price);

      if (!isCrypto) {
        try {
          const intervalMap = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "60m", "4h": "60m", "1d": "1d" };
          const rangeMap = { "1m": "1d", "5m": "1d", "15m": "5d", "1h": "5d", "4h": "1mo", "1d": "1y" };
          const interval = intervalMap[timeframe.interval] || "5m";
          const range = rangeMap[timeframe.interval] || "1d";
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${asset.yahooSymbol}?range=${range}&interval=${interval}`;
          const response = await fetch(`https://proxy.cors.dev/${url}`);
          if (!response.ok) throw new Error(`Stock API HTTP ${response.status}`);
          const json = await response.json();
          const result = json?.chart?.result?.[0];
          const quote = result?.indicators?.quote?.[0];
          if (!result?.timestamp?.length || !quote) throw new Error("No stock candles returned");
          const stockCandles = result.timestamp.map((time, i) => ({
            time: time * 1000,
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
          })).filter((c) => [c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v)));
          if (!stockCandles.length) throw new Error("No valid stock candles returned");
          if (!cancelled) {
            setCandles(stockCandles);
            const latest = stockCandles[stockCandles.length - 1].close;
            setLivePrice(latest);
            onPriceUpdate?.(asset.symbol, Number(result.meta?.regularMarketPrice ?? latest));
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setError("Stock API unavailable — retrying; watchlist quote may still update.");
            setLoading(false);
          }
        }
        return;
      }

      try {
        const response = await fetch(`${BINANCE_REST}?symbol=${asset.binanceSymbol}&interval=${timeframe.interval}&limit=100`);
        if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        setCandles(data.map((c) => ({
          time: c[0],
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        })));
        const latest = Number(data[data.length - 1][4]);
        setLivePrice(latest);
        onPriceUpdate?.(asset.symbol, latest);
        setLoading(false);

        ws = new WebSocket(`${BINANCE_WS}/${asset.binanceSymbol.toLowerCase()}@kline_${timeframe.interval}`);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          const k = payload.k;
          const next = {
            time: k.t,
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
          };
          setLivePrice(next.close);
          onPriceUpdate?.(asset.symbol, next.close);
          setCandles((prev) => {
            if (!prev.length) return [next];
            const last = prev[prev.length - 1];
            if (last.time === next.time) return [...prev.slice(0, -1), next];
            return [...prev.slice(-99), next];
          });
        };
        ws.onerror = () => setError("Live stream unavailable — showing last API candles.");
      } catch (err) {
        if (!cancelled) {
          setError("Binance API unavailable. Check internet connection or try again.");
          setLoading(false);
        }
      }
    };

    loadMarketData();
    return () => {
      cancelled = true;
      if (ws) ws.close();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [asset.symbol, asset.binanceSymbol, asset.seed, asset.change, timeframe.interval, isCrypto]);

  const chart = useMemo(() => {
    if (!candles.length) return null;
    const width = 1000;
    const height = 390;
    const pad = { top: 18, right: 18, bottom: 30, left: 18 };
    const max = Math.max(...candles.map((c) => c.high));
    const min = Math.min(...candles.map((c) => c.low));
    const range = max - min || 1;
    const y = (price) => pad.top + ((max - price) / range) * (height - pad.top - pad.bottom);
    const step = (width - pad.left - pad.right) / candles.length;
    const bodyWidth = Math.max(3, step * 0.58);
    const x = (i) => pad.left + step * i + step / 2;
    return { width, height, pad, max, min, y, step, bodyWidth, x };
  }, [candles]);

  const formatPrice = (value) => value >= 1000
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <h2>{asset.symbol}</h2>
          <div className="price">${formatPrice(livePrice)}</div>
          <span className={asset.change < 0 ? "negative" : "positive"}>
            {asset.change > 0 ? "+" : ""}{asset.change.toFixed(2)}%
          </span>
        </div>
        <div className="timeframes">
          {periods.map((period) => (
            <button key={period.label} className={timeframe.label === period.label ? "active" : ""} onClick={() => setTimeframe(period)}>
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-area">
        {loading && <div className="chart-overlay">Loading market data…</div>}
        {!loading && candles.length > 0 && chart && (
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="candlestick-chart" preserveAspectRatio="none">
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
              <line key={ratio} x1="0" x2={chart.width} y1={chart.height * ratio} y2={chart.height * ratio} className="chart-grid-line" />
            ))}
            {candles.map((candle, i) => {
              const cx = chart.x(i);
              const bullish = candle.close >= candle.open;
              const bodyTop = chart.y(Math.max(candle.open, candle.close));
              const bodyHeight = Math.max(2, Math.abs(chart.y(candle.open) - chart.y(candle.close)));
              return (
                <g key={`${candle.time}-${i}`}>
                  <line x1={cx} x2={cx} y1={chart.y(candle.high)} y2={chart.y(candle.low)} className={bullish ? "candle-wick-up" : "candle-wick-down"} />
                  <rect x={cx - chart.bodyWidth / 2} y={bodyTop} width={chart.bodyWidth} height={bodyHeight} className={bullish ? "candle-up" : "candle-down"} rx="1" />
                </g>
              );
            })}
          </svg>
        )}
        {!loading && !candles.length && <div className="chart-overlay">No market data available.</div>}
        <div className="chart-label">{timeframe.label} • {isCrypto ? "BINANCE LIVE API + WEBSOCKET" : "YAHOO FINANCE STOCK API"}</div>
        {error && <div className="chart-error">{error}</div>}
      </div>
    </div>
  );
}

export default Chart;
