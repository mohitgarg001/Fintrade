# FinTrade — Final Demo Build

React + Vite financial trading dashboard for project evaluation.

## Features
- Binance public market data for BTC/USD, ETH/USD and SOL/USD
- Historical candlesticks through Binance REST market-data API
- Live candlestick updates through Binance WebSocket streams
- Live order book for supported crypto assets
- 1M, 5M, 15M, 1H, 4H and 1D chart intervals
- Asset search and watchlist switching
- AAPL/TSLA demo market data (Binance is crypto market data here)
- Paper BUY/SELL with simulated balance and holdings
- Portfolio and performance sections

## Run
```bash
npm install
npm run dev
```

No Binance API key is required for the public market-data endpoints used by this demo.


## Market data notes
- BTC, ETH and SOL use Binance public REST endpoints and WebSocket streams for candles and order-book updates.
- AAPL and TSLA quotes and candlestick history use Yahoo Finance chart data through the `cors.dev` browser proxy; the watchlist refreshes about once per minute. US stock data may be delayed, may not update outside market hours, and this unofficial endpoint/proxy can occasionally be unavailable.
- The AAPL/TSLA order-book panel is clearly marked DEMO because Binance's crypto order book does not provide those equity order books.
- BUY/SELL is paper trading only. No real orders are sent to any exchange.
