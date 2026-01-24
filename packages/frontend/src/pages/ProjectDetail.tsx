import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { ProjectWithDetails, Habit } from '@habit-tracker/shared';
import { projectsApi, habitsApi } from '../api/client';

export function ProjectDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  const fetchProject = useCallback(async (): Promise<void> => {
    if (!id) return;

    try {
      const response = await projectsApi.getById(id);
      if (response.success && response.data) {
        setProject(response.data);
        setEditContent(response.data.content);
        setEditName(response.data.name);
        setEditDescription(response.data.description || '');
        setSelectedHabitIds(response.data.habitIds);
      } else {
        setError(response.error || 'Failed to load project');
      }
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHabits = useCallback(async (): Promise<void> => {
    try {
      const response = await habitsApi.getAll();
      if (response.success && response.data) {
        setAllHabits(response.data);
      }
    } catch {
      // Silently fail - habits list is optional
    }
  }, []);

  useEffect(() => {
    fetchProject();
    fetchHabits();
  }, [fetchProject, fetchHabits]);

  async function handleSave(): Promise<void> {
    if (!id || !project) return;

    setIsSaving(true);
    try {
      const response = await projectsApi.update(id, {
        name: editName,
        description: editDescription || undefined,
        content: editContent,
      });

      if (response.success && response.data) {
        setProject(response.data);
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to save project');
      }
    } catch {
      setError('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    try {
      const response = await projectsApi.delete(id);
      if (response.success) {
        navigate('/projects');
      } else {
        setError(response.error || 'Failed to delete project');
      }
    } catch {
      setError('Failed to delete project');
    }
  }

  async function handleLinkHabits(): Promise<void> {
    if (!id) return;

    try {
      const response = await projectsApi.linkHabits(id, { habitIds: selectedHabitIds });
      if (response.success && response.data) {
        setProject(response.data);
        setShowLinkModal(false);
      } else {
        setError(response.error || 'Failed to link habits');
      }
    } catch {
      setError('Failed to link habits');
    }
  }

  function toggleHabitSelection(habitId: string): void {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  }

  if (loading) {
    return (
      <div className="project-detail-page">
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="error">Project not found</div>
        <Link to="/projects" className="back-link">
          &larr; Back to Projects
        </Link>
      </div>
    );
  }

  const linkedHabits = allHabits.filter((h) => project.habitIds.includes(h.id));

  return (
    <div className="project-detail-page">
      <header className="project-detail-header">
        <Link to="/projects" className="back-link">
          &larr; Back to Projects
        </Link>

        {isEditing ? (
          <div className="edit-header">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="edit-name-input"
              placeholder="Project name"
            />
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="edit-description-input"
              placeholder="Short description (optional)"
            />
          </div>
        ) : (
          <>
            <h1>{project.name}</h1>
            {project.description && <p className="project-description">{project.description}</p>}
          </>
        )}

        <div className="header-actions">
          {isEditing ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving || !editName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(project.content);
                  setEditName(project.name);
                  setEditDescription(project.description || '');
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      <main className="project-detail-main">
        {error && <div className="error">{error}</div>}

        <section className="project-habits-section">
          <div className="section-header">
            <h2>Linked Habits</h2>
            <button className="btn btn-small" onClick={() => setShowLinkModal(true)}>
              Manage Links
            </button>
          </div>

          {linkedHabits.length === 0 ? (
            <p className="no-habits">No habits linked to this project yet.</p>
          ) : (
            <div className="linked-habits-list">
              {linkedHabits.map((habit) => (
                <div key={habit.id} className="linked-habit-item">
                  <span className="habit-name">{habit.name}</span>
                  {habit.description && (
                    <span className="habit-description">{habit.description}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="project-content-section">
          <h2>Project Plan</h2>

          {isEditing ? (
            <textarea
              className="markdown-editor"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your project plan in markdown..."
            />
          ) : (
            <div className="markdown-content">
              {project.content ? (
                <pre className="markdown-preview">{project.content}</pre>
              ) : (
                <p className="empty-content">No content yet. Click Edit to add your project plan.</p>
              )}
            </div>
          )}
        </section>
      </main>

      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Link Habits to Project</h2>
            <p className="modal-description">
              Select habits to connect to this project. Linked habits will show the project
              association.
            </p>

            <div className="habits-selection-list">
              {allHabits.length === 0 ? (
                <p className="no-habits">No habits available. Create some habits first.</p>
              ) : (
                allHabits.map((habit) => (
                  <label key={habit.id} className="habit-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedHabitIds.includes(habit.id)}
                      onChange={() => toggleHabitSelection(habit.id)}
                    />
                    <span className="habit-name">{habit.name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleLinkHabits}>
                Save Links
              </button>
              <button className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
