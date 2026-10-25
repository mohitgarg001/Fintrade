import "./App.css";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Watchlist from "./components/Watchlist";
import Chart from "./components/Chart";
import OrderBook from "./components/OrderBook";
import TradePanel from "./components/TradePanel";
import Portfolio from "./components/Portfolio";
import Performance from "./components/Performance";

const assets = [
  { symbol: "BTC/USD", price: 67245.20, change: 2.34, seed: 1, binanceSymbol: "BTCUSDT" },
  { symbol: "ETH/USD", price: 3542.10, change: 1.20, seed: 2, binanceSymbol: "ETHUSDT" },
  { symbol: "SOL/USD", price: 145.22, change: -0.82, seed: 3, binanceSymbol: "SOLUSDT" },
  { symbol: "AAPL", price: 225.40, change: 0.45, seed: 4, yahooSymbol: "AAPL" },
  { symbol: "TSLA", price: 340.20, change: -1.32, seed: 5, yahooSymbol: "TSLA" },
];

function App() {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [balance, setBalance] = useState(100000);
  const [holdings, setHoldings] = useState({});
  const [tradeMessage, setTradeMessage] = useState("");
  const [livePrices, setLivePrices] = useState({});
  const [liveChanges, setLiveChanges] = useState({});
  const [stockStatus, setStockStatus] = useState("Connecting to stock market data…");
  const [stockUpdatedAt, setStockUpdatedAt] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadStockQuotes = async () => {
      try {
        const quotes = await Promise.all(assets.filter((item) => item.yahooSymbol).map(async (item) => {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${item.yahooSymbol}?range=1d&interval=1m`;
          const response = await fetch(`https://proxy.cors.dev/${url}`);
          if (!response.ok) throw new Error(`Stock quote request failed (${response.status})`);
          const json = await response.json();
          const result = json?.chart?.result?.[0];
          if (!result?.meta) throw new Error("Stock quote data unavailable");
          const meta = result.meta;
          const price = Number(meta.regularMarketPrice);
          const previousClose = Number(meta.chartPreviousClose ?? meta.previousClose);
          if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid stock price");
          return { symbol: item.symbol, price, change: Number.isFinite(previousClose) && previousClose ? ((price - previousClose) / previousClose) * 100 : item.change };
        }));
        if (cancelled) return;
        setLivePrices((prev) => ({ ...prev, ...Object.fromEntries(quotes.map((q) => [q.symbol, q.price])) }));
        setLiveChanges((prev) => ({ ...prev, ...Object.fromEntries(quotes.map((q) => [q.symbol, q.change])) }));
        setStockStatus("STOCK API CONNECTED");
        setStockUpdatedAt(new Date().toLocaleTimeString());
      } catch {
        if (!cancelled) setStockStatus("STOCK API UNAVAILABLE · RETRYING");
      }
    };
    loadStockQuotes();
    const timer = setInterval(loadStockQuotes, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const displayedAssets = assets.map((item) => ({ ...item, price: livePrices[item.symbol] ?? item.price, change: liveChanges[item.symbol] ?? item.change }));
  const filteredAssets = displayedAssets.filter((item) => item.symbol.toLowerCase().includes(search.toLowerCase().trim()));
  const displayedSelectedAsset = displayedAssets.find((item) => item.symbol === selectedAsset.symbol) ?? selectedAsset;

  const handleTrade = (type, quantity) => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setTradeMessage("Enter a valid quantity.");
      return;
    }

    const currentPrice = livePrices[selectedAsset.symbol] ?? selectedAsset.price;
    const value = qty * currentPrice;
    const currentHolding = holdings[selectedAsset.symbol] || 0;

    if (type === "BUY") {
      if (value > balance) {
        setTradeMessage("Insufficient paper-trading balance.");
        return;
      }
      setBalance((prev) => prev - value);
      setHoldings((prev) => ({ ...prev, [selectedAsset.symbol]: currentHolding + qty }));
      setTradeMessage(`Bought ${qty} ${selectedAsset.symbol} for $${value.toFixed(2)}`);
    } else {
      if (qty > currentHolding) {
        setTradeMessage(`You only hold ${currentHolding} ${selectedAsset.symbol}.`);
        return;
      }
      setBalance((prev) => prev + value);
      setHoldings((prev) => ({ ...prev, [selectedAsset.symbol]: currentHolding - qty }));
      setTradeMessage(`Sold ${qty} ${selectedAsset.symbol} for $${value.toFixed(2)}`);
    }
  };

  return (
    <div className="app">
      <Navbar search={search} onSearch={setSearch} />
      <div className="dashboard">
        <aside className="left-panel">
          <Watchlist assets={filteredAssets} selectedAsset={displayedSelectedAsset} onSelect={setSelectedAsset} />
        </aside>
        <main className="main-panel">
          <section className="chart-section"><Chart asset={displayedSelectedAsset} onPriceUpdate={(symbol, price) => setLivePrices((prev) => ({ ...prev, [symbol]: price }))} /></section>
          <section className="portfolio-section">
            <Portfolio balance={balance} holdings={holdings} assets={displayedAssets} stockStatus={stockStatus} stockUpdatedAt={stockUpdatedAt} />
          </section>
          <section className="performance-section"><Performance /></section>
        </main>
        <aside className="right-panel">
          <OrderBook asset={displayedSelectedAsset} />
          <TradePanel
            asset={displayedSelectedAsset}
            balance={balance}
            onTrade={handleTrade}
            tradeMessage={tradeMessage}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
