import { useEffect, useState } from "react";

const REST = "https://data-api.binance.vision/api/v3/depth";
const WS = "wss://data-stream.binance.vision:443/ws";

function OrderBook({ asset }) {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [live, setLive] = useState(false);

  const isStock = Boolean(asset.yahooSymbol);

  useEffect(() => {
    let cancelled = false;
    let socket;
    setLive(false);
    setAsks([]);
    setBids([]);

    // Binance provides a real public depth stream for supported crypto pairs.
    if (asset.binanceSymbol) {
      const load = async () => {
        try {
          const response = await fetch(`${REST}?symbol=${asset.binanceSymbol}&limit=8`);
          if (!response.ok) throw new Error("Order book request failed");
          const data = await response.json();
          if (cancelled) return;
          setAsks(data.asks.slice(0, 6).map(([price, amount]) => [Number(price), Number(amount)]));
          setBids(data.bids.slice(0, 6).map(([price, amount]) => [Number(price), Number(amount)]));
          setLive(true);

          socket = new WebSocket(`${WS}/${asset.binanceSymbol.toLowerCase()}@depth10@100ms`);
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setAsks(data.a.slice(0, 6).map(([price, amount]) => [Number(price), Number(amount)]));
            setBids(data.b.slice(0, 6).map(([price, amount]) => [Number(price), Number(amount)]));
            setLive(true);
          };
          socket.onerror = () => setLive(false);
        } catch {
          if (!cancelled) setLive(false);
        }
      };
      load();
      return () => {
        cancelled = true;
        if (socket) socket.close();
      };
    }

    // The free quote source used by this project does not expose a real US-equity
    // order book. Show illustrative depth levels around the current quote instead
    // of falsely labelling simulated stock depth as a live exchange order book.
    if (asset.yahooSymbol) {
      return () => { cancelled = true; };
    }

    return () => { cancelled = true; };
  }, [asset.symbol, asset.binanceSymbol, asset.yahooSymbol, asset.price]);

  const fmt = (n) => n >= 1000
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const demoOrders = () => {
    const base = asset.price;
    return {
      asks: [0.00052, 0.00037, 0.00022, 0.00008].map((n, i) => [base * (1 + n * (i + 1)), [0.42, 1.24, 0.85, 2.10][i]]),
      bids: [0.00008, 0.00022, 0.00037, 0.00052].map((n, i) => [base * (1 - n * (i + 1)), [1.50, 0.95, 2.40, 0.60][i]]),
    };
  };

  const fallback = demoOrders();
  const stockBase = Number(asset.price) || 0;
  const stockOffsets = [0.00025, 0.0005, 0.00075, 0.001, 0.00125, 0.0015];
  const stockAsks = stockOffsets.map((offset, i) => [stockBase * (1 + offset), [12, 8, 17, 6, 21, 10][i]]);
  const stockBids = stockOffsets.map((offset, i) => [stockBase * (1 - offset), [15, 11, 7, 19, 9, 14][i]]);
  const displayAsks = isStock ? stockAsks : asks.length ? asks : fallback.asks;
  const displayBids = isStock ? stockBids : bids.length ? bids : fallback.bids;
  const bestAsk = displayAsks[0]?.[0] ?? asset.price;
  const bestBid = displayBids[0]?.[0] ?? asset.price;
  const spread = Math.max(0, bestAsk - bestBid);
  const status = asset.yahooSymbol ? "SIMULATED DEPTH · LIVE QUOTE" : live ? "BINANCE LIVE" : "CONNECTING / DEMO";

  return (
    <div className="orderbook">
      <h3>ORDER BOOK • {asset.symbol} <span className="live-status">● {status}</span></h3>
      {isStock && <p className="orderbook-note">Illustrative levels follow the latest quote; this is not a real exchange order book.</p>}
      <div className="order-header"><span>Price (USD)</span><span>{isStock ? "Shares" : "Amount"}</span></div>
      <div className="sell-orders">
        {displayAsks.slice().reverse().map((order, index) => <div className="order sell" key={`ask-${index}`}><span>{fmt(order[0])}</span><span>{isStock ? order[1].toFixed(0) : order[1].toFixed(4)}</span></div>)}
      </div>
      <div className="spread">SPREAD ${fmt(spread)}</div>
      <div className="buy-orders">
        {displayBids.map((order, index) => <div className="order buy" key={`bid-${index}`}><span>{fmt(order[0])}</span><span>{isStock ? order[1].toFixed(0) : order[1].toFixed(4)}</span></div>)}
      </div>
    </div>
  );
}
export default OrderBook;
