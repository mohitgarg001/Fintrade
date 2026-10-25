import { useState } from "react";

function TradePanel({ asset, balance, onTrade, tradeMessage }) {
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("Market");

  const submitTrade = () => onTrade(type, quantity);

  return (
    <div className="trade-panel">
      <h3>PAPER TRADING</h3>
      <div className="balance"><span>AVAILABLE BALANCE</span><h2>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2></div>
      <div className="trade-tabs">
        <button className={type === "BUY" ? "active-buy" : ""} onClick={() => setType("BUY")}>BUY</button>
        <button className={type === "SELL" ? "active-sell" : ""} onClick={() => setType("SELL")}>SELL</button>
      </div>
      <div className="form-group">
        <label>ORDER TYPE</label>
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
          <option>Market</option><option>Limit</option>
        </select>
      </div>
      <div className="form-group">
        <label>QUANTITY ({asset.symbol})</label>
        <input type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <button onClick={submitTrade} className={type === "BUY" ? "trade-button buy-button" : "trade-button sell-button"}>
        {type} {asset.symbol.split("/")[0]}
      </button>
      {tradeMessage && <p className="trade-message">{tradeMessage}</p>}
    </div>
  );
}
export default TradePanel;
