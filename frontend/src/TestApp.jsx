export default function TestApp() {
  return (
    <div style={{ padding: '50px', fontSize: '24px', color: 'blue' }}>
      <h1>TEST - If you see this, React is working!</h1>
      <p>Backend health check test below:</p>
      <button onClick={() => {
        fetch('/health')
          .then(r => r.json())
          .then(data => alert(JSON.stringify(data)))
          .catch(err => alert('Error: ' + err.message));
      }}>
        Test Backend
      </button>
    </div>
  );
}
