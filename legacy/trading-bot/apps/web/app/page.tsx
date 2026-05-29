export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Trading Bot Dashboard</h1>
        <p style={{ marginBottom: 16 }}>Welcome — development mode is running.</p>
        <div>
          <a href="/chat" style={{ marginRight: 12 }}>
            Chat
          </a>
          <a href="/api/mediator/health" style={{ marginRight: 12 }}>
            Health
          </a>
          <a href="/api/finance/quotes">Quotes</a>
        </div>
      </div>
    </main>
  );
}
