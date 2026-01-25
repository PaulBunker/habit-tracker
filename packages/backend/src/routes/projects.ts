/**
 * Project management REST API routes.
 *
 * Provides CRUD operations for projects and habit-project linking.
 * All responses follow the {@link ApiResponse} wrapper format.
 *
 * @packageDocumentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { projects, habitProjects, habits } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

// Get projects directory based on environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const PROJECTS_DIR =
  NODE_ENV === 'production'
    ? path.join(os.homedir(), '.habit-tracker', 'projects')
    : path.join(process.env.INIT_CWD || process.cwd(), 'packages', 'backend', 'data', 'dev', 'projects');

// Ensure projects directory exists
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  content: z.string().optional(),
});

const linkHabitsSchema = z.object({
  habitIds: z.array(z.string().uuid()),
});

/**
 * Generate a slug from a project name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Read markdown content from file
 */
function readMarkdownFile(markdownPath: string): string {
  try {
    if (fs.existsSync(markdownPath)) {
      return fs.readFileSync(markdownPath, 'utf-8');
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Write markdown content to file
 */
function writeMarkdownFile(markdownPath: string, content: string): void {
  const dir = path.dirname(markdownPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(markdownPath, content, 'utf-8');
}

/**
 * GET /api/projects
 *
 * Retrieves all projects with their linked habit IDs.
 *
 * @returns {ApiResponse<Project[]>} Array of project objects
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const allProjects = await db.select().from(projects);

    // Get linked habits for each project
    const projectsWithHabits = await Promise.all(
      allProjects.map(async (project) => {
        const links = await db
          .select({ habitId: habitProjects.habitId })
          .from(habitProjects)
          .where(eq(habitProjects.projectId, project.id));

        return {
          ...project,
          habitIds: links.map((l) => l.habitId),
        };
      })
    );

    res.json({ success: true, data: projectsWithHabits });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 *
 * Retrieves a single project by ID with its markdown content and linked habits.
 *
 * @param id - Project UUID (path parameter)
 * @returns {ApiResponse<ProjectWithDetails>} The project with content and habitIds
 * @throws {404} Project not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Get linked habit IDs
    const links = await db
      .select({ habitId: habitProjects.habitId })
      .from(habitProjects)
      .where(eq(habitProjects.projectId, project.id));

    // Read markdown content
    const content = readMarkdownFile(project.markdownPath);

    res.json({
      success: true,
      data: {
        ...project,
        content,
        habitIds: links.map((l) => l.habitId),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 *
 * Creates a new project with an optional initial markdown content.
 *
 * @body {CreateProjectRequest} Project creation data
 * @returns {ApiResponse<Project>} The created project (201 Created)
 * @throws {400} Validation error
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const slug = generateSlug(validatedData.name);
    const markdownPath = path.join(PROJECTS_DIR, `${slug}.md`);

    // Ensure unique filename
    let finalPath = markdownPath;
    let counter = 1;
    while (fs.existsSync(finalPath)) {
      finalPath = path.join(PROJECTS_DIR, `${slug}-${counter}.md`);
      counter++;
    }

    const newProject = {
      id: randomUUID(),
      name: validatedData.name,
      description: validatedData.description || null,
      markdownPath: finalPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create the markdown file with initial content
    const initialContent = validatedData.content || `# ${validatedData.name}\n\n`;
    writeMarkdownFile(finalPath, initialContent);

    await db.insert(projects).values(newProject);

    res.status(201).json({
      success: true,
      data: {
        ...newProject,
        content: initialContent,
        habitIds: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/projects/:id
 *
 * Updates an existing project. All fields are optional.
 *
 * @param id - Project UUID (path parameter)
 * @body {UpdateProjectRequest} Fields to update
 * @returns {ApiResponse<ProjectWithDetails>} The updated project
 * @throws {404} Project not found
 * @throws {400} Validation error
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [existingProject] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    if (!existingProject) {
      throw new AppError(404, 'Project not found');
    }

    const validatedData = updateProjectSchema.parse(req.body);

    const updateData: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;

    // Update markdown content if provided
    if (validatedData.content !== undefined) {
      writeMarkdownFile(existingProject.markdownPath, validatedData.content);
    }

    await db.update(projects).set(updateData).where(eq(projects.id, req.params.id));

    const [updatedProject] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    // Get linked habit IDs
    const links = await db
      .select({ habitId: habitProjects.habitId })
      .from(habitProjects)
      .where(eq(habitProjects.projectId, updatedProject.id));

    const content = readMarkdownFile(updatedProject.markdownPath);

    res.json({
      success: true,
      data: {
        ...updatedProject,
        content,
        habitIds: links.map((l) => l.habitId),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id
 *
 * Permanently deletes a project and its markdown file.
 *
 * @param id - Project UUID (path parameter)
 * @returns {ApiResponse<{message: string}>} Success confirmation
 * @throws {404} Project not found
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [existingProject] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    if (!existingProject) {
      throw new AppError(404, 'Project not found');
    }

    // Delete the markdown file
    try {
      if (fs.existsSync(existingProject.markdownPath)) {
        fs.unlinkSync(existingProject.markdownPath);
      }
    } catch {
      // Ignore file deletion errors
    }

    // Delete habit-project links first (foreign key constraint)
    await db.delete(habitProjects).where(eq(habitProjects.projectId, req.params.id));

    // Delete the project
    await db.delete(projects).where(eq(projects.id, req.params.id));

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/projects/:id/habits
 *
 * Sets the habits linked to a project. Replaces existing links.
 *
 * @param id - Project UUID (path parameter)
 * @body {LinkHabitsRequest} Array of habit IDs to link
 * @returns {ApiResponse<ProjectWithDetails>} The updated project with habit links
 * @throws {404} Project not found
 * @throws {400} Invalid habit IDs
 */
router.put('/:id/habits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const validatedData = linkHabitsSchema.parse(req.body);

    // Verify all habit IDs exist
    if (validatedData.habitIds.length > 0) {
      const existingHabits = await db
        .select({ id: habits.id })
        .from(habits)
        .where(inArray(habits.id, validatedData.habitIds));

      if (existingHabits.length !== validatedData.habitIds.length) {
        throw new AppError(400, 'One or more habit IDs are invalid');
      }
    }

    // Remove existing links
    await db.delete(habitProjects).where(eq(habitProjects.projectId, req.params.id));

    // Create new links
    if (validatedData.habitIds.length > 0) {
      await db.insert(habitProjects).values(
        validatedData.habitIds.map((habitId) => ({
          habitId,
          projectId: req.params.id,
        }))
      );
    }

    // Update project timestamp
    await db
      .update(projects)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(projects.id, req.params.id));

    const [updatedProject] = await db.select().from(projects).where(eq(projects.id, req.params.id));
    const content = readMarkdownFile(updatedProject.markdownPath);

    res.json({
      success: true,
      data: {
        ...updatedProject,
        content,
        habitIds: validatedData.habitIds,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id/habits
 *
 * Gets the habits linked to a project.
 *
 * @param id - Project UUID (path parameter)
 * @returns {ApiResponse<Habit[]>} Array of linked habits
 * @throws {404} Project not found
 */
router.get('/:id/habits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, req.params.id));

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Get linked habit IDs
    const links = await db
      .select({ habitId: habitProjects.habitId })
      .from(habitProjects)
      .where(eq(habitProjects.projectId, project.id));

    if (links.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get the actual habits
    const linkedHabits = await db
      .select()
      .from(habits)
      .where(inArray(habits.id, links.map((l) => l.habitId)));

    res.json({ success: true, data: linkedHabits });
  } catch (error) {
    next(error);
  }
});

export default router;
