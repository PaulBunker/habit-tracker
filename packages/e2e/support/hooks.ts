import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(async function () {
  // Start backend and frontend servers
  console.log('Starting test environment...');
});

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  await this.cleanup();
});

AfterAll(async function () {
  // Cleanup test environment
  console.log('Cleaning up test environment...');
});
