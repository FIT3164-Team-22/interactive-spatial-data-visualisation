import useApi from './hooks/useApi'; // Import our custom hook
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

// A small, clean component to display the API status
function ApiStatusDisplay() {
  // Use our custom hook! All the complex logic is hidden away.
  const { data, loading, error } = useApi('/api/test');

  if (loading) return <p>Loading data from backend...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <p>
      <strong>Response from backend:</strong> "{data?.message}"
    </p>
  );
}

function App() {
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Flask</h1>
      <div className="card">
        <h2>API Communication Test</h2>
        <ApiStatusDisplay />
      </div>
    </>
  );
}

export default App;