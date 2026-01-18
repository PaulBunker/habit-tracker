import { request } from '@playwright/test';

/**
 * Global setup that runs before all E2E tests.
 * Ensures tests are not running against production environment.
 */
async function globalSetup(): Promise<void> {
  const baseURL = process.env.BASE_URL || 'http://localhost:5174';

  // Check if we're accidentally pointing at production ports
  if (baseURL.includes(':5173') || baseURL.includes(':3000')) {
    throw new Error(
      `E2E tests are configured to run against production ports!\n` +
        `Current baseURL: ${baseURL}\n` +
        `E2E tests must run against development ports (5174/3001).\n` +
        `Check playwright.config.ts baseURL setting.`
    );
  }

  // Verify the backend is running in development mode
  const context = await request.newContext({ baseURL });
  try {
    const response = await context.get('/api/status');
    if (response.ok()) {
      const data = await response.json();
      const environment = data.data?.environment;

      if (environment === 'production') {
        throw new Error(
          `E2E tests detected a production backend!\n` +
            `Backend reports environment: ${environment}\n` +
            `E2E tests must not run against production.\n` +
            `Start the dev server with: npm run dev`
        );
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('E2E tests')) {
      throw error;
    }
    // Server not running yet is OK - webServer config will start it
  } finally {
    await context.dispose();
  }
}

export default globalSetup;
