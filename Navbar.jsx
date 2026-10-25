function Navbar({ search, onSearch }) {
  return (
    <nav className="navbar">
      <div className="logo">FIN<span>TRADE</span></div>
      <div className="market-status">
        <span className="status-dot"></span> MARKET LIVE
      </div>
      <div className="nav-right">
        <input
          type="text"
          placeholder="Search assets..."
          className="search-box"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </nav>
  );
}
export default Navbar;
