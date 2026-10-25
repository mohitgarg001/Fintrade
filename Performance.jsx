function Performance() {
  return (
    <div className="performance">
      <div className="section-header"><h3>PERFORMANCE MONITOR</h3><span className="live-status">● LIVE</span></div>
      <div className="performance-grid">
        <div className="performance-item"><p>Updates/sec</p><h2>1,245</h2></div>
        <div className="performance-item"><p>Render FPS</p><h2>60</h2></div>
        <div className="performance-item"><p>Messages Buffered</p><h2>82</h2></div>
        <div className="performance-item"><p>Processing</p><h2>3.4ms</h2></div>
      </div>
    </div>
  );
}
export default Performance;