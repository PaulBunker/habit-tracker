import { Link } from 'react-router-dom';

export function Playground(): JSX.Element {
  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link to="/" className="back-link">
          &larr; Back to Habits
        </Link>
        <h1>Playground</h1>
      </header>
      <main className="settings-main">
        <p>Development playground for testing components.</p>
      </main>
    </div>
  );
}
