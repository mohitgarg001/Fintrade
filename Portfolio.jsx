function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Portfolio({ balance, holdings, assets, stockStatus, stockUpdatedAt }) {
  const positions = Object.entries(holdings)
    .map(([symbol, quantity]) => {
      const asset = assets.find((item) => item.symbol === symbol);
      return asset ? { ...asset, quantity, value: quantity * asset.price } : null;
    })
    .filter((item) => item && item.quantity > 0);
  const holdingsValue = positions.reduce((sum, item) => sum + item.value, 0);
  const total = balance + holdingsValue;
  const netPnl = total - 100000;
  const pnlPercent = (netPnl / 100000) * 100;
  const investedPercent = total > 0 ? (holdingsValue / total) * 100 : 0;

  return (
    <div className="portfolio">
      <div className="section-header portfolio-heading">
        <div><h3>YOUR PORTFOLIO</h3><p className="portfolio-subtitle">Paper-trading account · values update with market prices</p></div>
        <span className="paper-badge">● PAPER ACCOUNT</span>
      </div>

      <div className="portfolio-cards">
        <div className="stat-card total-card"><p>Total account value</p><h2>{money(total)}</h2><span className="stat-foot">Cash + current holdings</span></div>
        <div className="stat-card"><p>Available cash</p><h2>{money(balance)}</h2><span className="stat-foot">Ready to trade</span></div>
        <div className="stat-card"><p>Holdings value</p><h2>{money(holdingsValue)}</h2><span className="stat-foot">{positions.length} open {positions.length === 1 ? "position" : "positions"}</span></div>
        <div className="stat-card"><p>Net P&amp;L since start</p><h2 className={netPnl >= 0 ? "positive" : "negative"}>{netPnl >= 0 ? "+" : "−"}{money(Math.abs(netPnl))}</h2><span className="stat-foot">{netPnl >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}% vs. $100,000 start</span></div>
      </div>

      <div className="allocation-card">
        <div className="allocation-top"><div><h4>PORTFOLIO ALLOCATION</h4><p>How your paper account is distributed</p></div><strong>{investedPercent.toFixed(1)}% invested</strong></div>
        <div className="allocation-track"><span style={{ width: `${Math.min(100, investedPercent)}%` }} /></div>
        <div className="allocation-legend"><span><i className="legend-cash" /> Cash <b>{money(balance)}</b></span><span><i className="legend-invested" /> Invested <b>{money(holdingsValue)}</b></span></div>
      </div>

      <div className="positions-card">
        <div className="positions-heading"><h4>YOUR POSITIONS</h4><span>{positions.length} ASSETS</span></div>
        {positions.length === 0 ? (
          <div className="empty-portfolio"><div className="empty-icon">↗</div><strong>Your portfolio is ready</strong><p>Buy an asset using the Trade Panel and your position will appear here.</p></div>
        ) : (
          <div className="positions-table-wrap"><table className="positions-table"><thead><tr><th>ASSET</th><th>QUANTITY</th><th>MARK PRICE</th><th>MARKET VALUE</th><th>ALLOCATION</th></tr></thead><tbody>
            {positions.map((item) => <tr key={item.symbol}><td><span className="position-symbol">{item.symbol}</span><small>{item.yahooSymbol ? "US EQUITY" : "CRYPTO"}</small></td><td>{Number(item.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td><td>{money(item.price)}</td><td className="position-value">{money(item.value)}</td><td><div className="position-allocation"><span>{total ? ((item.value / total) * 100).toFixed(1) : "0.0"}%</span><i><b style={{ width: `${total ? Math.min(100, (item.value / total) * 100) : 0}%` }} /></i></div></td></tr>)}
          </tbody></table></div>
        )}
      </div>
      <div className="portfolio-data-note"><span className={stockStatus.includes("CONNECTED") ? "data-dot connected" : "data-dot"} />{stockStatus}{stockUpdatedAt ? ` · Updated ${stockUpdatedAt}` : ""}<span className="data-note-right">US stock quotes may be delayed; refreshes every 60 sec</span></div>
    </div>
  );
}

export default Portfolio;
