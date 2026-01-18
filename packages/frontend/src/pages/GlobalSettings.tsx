import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AppSettings } from '@habit-tracker/shared';
import { isValidDomain } from '@habit-tracker/shared';
import { settingsApi } from '../api/client';

export function GlobalSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [websiteInput, setWebsiteInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      const response = await settingsApi.get();
      if (response.success && response.data) {
        setSettings(response.data);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleAddWebsite = async () => {
    const website = websiteInput.trim().toLowerCase();

    if (!website) {
      return;
    }

    if (!isValidDomain(website)) {
      setError('Invalid domain format. Enter a domain like "reddit.com"');
      return;
    }

    if (settings?.blockedWebsites.includes(website)) {
      setError('Website already in the list');
      return;
    }

    try {
      const response = await settingsApi.addBlockedWebsite(website);
      if (response.success && response.data) {
        setSettings({ ...settings!, blockedWebsites: response.data.blockedWebsites });
        setWebsiteInput('');
        setError('');
      }
    } catch {
      setError('Failed to add website');
    }
  };

  const handleRemoveWebsite = async (website: string) => {
    try {
      const response = await settingsApi.removeBlockedWebsite(website);
      if (response.success && response.data) {
        setSettings({ ...settings!, blockedWebsites: response.data.blockedWebsites });
      }
    } catch {
      setError('Failed to remove website');
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link to="/" className="back-link">
          &larr; Back to Habits
        </Link>
        <h1>Global Settings</h1>
      </header>

      <main className="settings-main">
        <section className="settings-section">
          <h2>Blocked Websites</h2>
          <p className="section-description">
            These websites will be blocked when you have incomplete timed habits.
          </p>

          {error && <div className="error">{error}</div>}

          <div className="website-add">
            <input
              type="text"
              value={websiteInput}
              onChange={(e) => setWebsiteInput(e.target.value)}
              placeholder="e.g., reddit.com"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddWebsite();
                }
              }}
            />
            <button className="btn btn-primary" onClick={handleAddWebsite}>
              Add
            </button>
          </div>

          <div className="blocked-websites-list">
            {settings?.blockedWebsites.length === 0 ? (
              <p className="empty-list">No websites blocked yet.</p>
            ) : (
              settings?.blockedWebsites.map((website) => (
                <div key={website} className="blocked-website-item">
                  <span>{website}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveWebsite(website)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="settings-section">
          <h2>How It Works</h2>
          <div className="info-box">
            <p><strong>Blocking starts</strong> when any habit with a start time reaches that time.</p>
            <p><strong>Blocking ends</strong> when ALL timed habits are completed or skipped.</p>
            <p><strong>Missed habits</strong> keep blocking until midnight, then reset.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
