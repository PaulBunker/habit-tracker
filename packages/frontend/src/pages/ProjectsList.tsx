import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Project } from '@habit-tracker/shared';
import { projectsApi } from '../api/client';

type ProjectWithHabits = Project & { habitIds: string[] };

export function ProjectsList(): JSX.Element {
  const [projects, setProjects] = useState<ProjectWithHabits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects(): Promise<void> {
    try {
      const response = await projectsApi.getAll();
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(): Promise<void> {
    if (!newProjectName.trim()) {
      return;
    }

    try {
      const response = await projectsApi.create({ name: newProjectName.trim() });
      if (response.success && response.data) {
        navigate(`/projects/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create project');
      }
    } catch {
      setError('Failed to create project');
    }
  }

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <header className="projects-header">
        <Link to="/" className="back-link">
          &larr; Back to Habits
        </Link>
        <h1>Projects</h1>
        <p className="header-description">
          Connect your habits to larger goals and learning plans.
        </p>
      </header>

      <main className="projects-main">
        {error && <div className="error">{error}</div>}

        {isCreating ? (
          <div className="create-project-form">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateProject();
                }
              }}
            />
            <div className="form-buttons">
              <button className="btn btn-primary" onClick={handleCreateProject}>
                Create
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-primary create-project-btn"
            onClick={() => setIsCreating(true)}
          >
            + New Project
          </button>
        )}

        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet.</p>
            <p className="empty-hint">
              Projects help you track progress toward larger goals like learning a new skill or
              completing a course.
            </p>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card"
              >
                <h3 className="project-name">{project.name}</h3>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <div className="project-meta">
                  <span className="habit-count">
                    {project.habitIds.length} habit{project.habitIds.length !== 1 ? 's' : ''} linked
                  </span>
                  <span className="project-date">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
