function Watchlist({ assets, selectedAsset, onSelect }) {
  return (
    <div className="watchlist">
      <div className="panel-title"><h3>WATCHLIST</h3><button onClick={() => alert("Add asset feature")}>+</button></div>
      <div className="watchlist-items">
        {assets.map((asset) => (
          <button
            className={`asset ${selectedAsset.symbol === asset.symbol ? "asset-active" : ""}`}
            key={asset.symbol}
            onClick={() => onSelect(asset)}
          >
            <div><h4>{asset.symbol}</h4><p>${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
            <span className={asset.change < 0 ? "negative" : "positive"}>
              {asset.change > 0 ? "+" : ""}{asset.change.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default Watchlist;
