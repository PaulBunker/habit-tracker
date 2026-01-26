/**
 * Unified Animation Capture Script
 *
 * A configurable script for capturing UI animations frame-by-frame using JSON configs.
 *
 * Usage:
 *   node scripts/capture-animation-unified.js <config> [animation] [options]
 *   node scripts/capture-animation-unified.js --list
 *
 * Arguments:
 *   config              Name of config file (without .json) from animation-configs/
 *   animation           Optional: specific animation to capture (default: all)
 *
 * Options:
 *   --frames=N          Override frame count
 *   --duration=MS       Override duration
 *   --verify            Run verification (if config supports it)
 *   --output=DIR        Output directory (default: .playwright-mcp)
 *   --list              List available configs
 *
 * Examples:
 *   node scripts/capture-animation-unified.js flip-modal open
 *   node scripts/capture-animation-unified.js flip-modal close --frames=20
 *   node scripts/capture-animation-unified.js progress-bar fill --verify
 *   node scripts/capture-animation-unified.js --list
 */

const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CONFIG_DIR = path.join(__dirname, 'animation-configs');
const DEFAULT_OUTPUT_DIR = '.playwright-mcp';

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    configName: null,
    animationName: null,
    frames: null,
    duration: null,
    verify: false,
    outputDir: DEFAULT_OUTPUT_DIR,
    list: false,
  };

  for (const arg of args) {
    if (arg === '--list') {
      options.list = true;
    } else if (arg === '--verify') {
      options.verify = true;
    } else if (arg.startsWith('--frames=')) {
      options.frames = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--duration=')) {
      options.duration = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      if (!options.configName) {
        options.configName = arg;
      } else if (!options.animationName) {
        options.animationName = arg;
      }
    }
  }

  return options;
}

// List available configs
function listConfigs() {
  console.log('\n=== Available Animation Configs ===\n');

  if (!fs.existsSync(CONFIG_DIR)) {
    console.log('No config directory found at:', CONFIG_DIR);
    return;
  }

  const files = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No config files found.');
    return;
  }

  for (const file of files) {
    const configPath = path.join(CONFIG_DIR, file);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const name = file.replace('.json', '');
    const animations = Object.keys(config.animations || {}).join(', ');

    console.log(`  ${name}`);
    console.log(`    Description: ${config.description || 'No description'}`);
    console.log(`    URL: ${config.url}`);
    console.log(`    Animations: ${animations}`);
    console.log('');
  }
}

// Load config by name
function loadConfig(name) {
  const configPath = path.join(CONFIG_DIR, `${name}.json`);

  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    console.error('\nRun with --list to see available configs.');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Calculate frame intervals
function getFrameIntervals(duration, frameCount) {
  const intervals = [];
  for (let i = 0; i < frameCount; i++) {
    intervals.push(Math.round((i / (frameCount - 1)) * duration));
  }
  return intervals;
}

// Execute a single action
async function executeAction(page, action) {
  if ('click' in action) {
    await page.click(action.click);
  } else if ('wait' in action) {
    await page.waitForTimeout(action.wait);
  } else if ('waitFor' in action) {
    await page.waitForSelector(action.waitFor, { timeout: 10000 });
  }
}

// Capture a single frame with verification data
async function captureFrame(page, ms, animConfig) {
  const frame = { ms, buffer: null, verifyValue: null };

  // Capture screenshot
  frame.buffer = await page.screenshot();

  // Capture verification attribute if configured
  if (animConfig.verify) {
    try {
      const element = await page.$(animConfig.verify.selector);
      if (element) {
        frame.verifyValue = await element.getAttribute(animConfig.verify.attribute);
      }
    } catch {
      // Ignore verification errors
    }
  }

  return frame;
}

// Capture animation frames
async function captureAnimation(page, config, animName, animConfig, options) {
  const frames = [];
  const duration = options.duration || animConfig.duration;
  const frameCount = options.frames || animConfig.frames || 10;
  const intervals = getFrameIntervals(duration, frameCount);

  console.log(`\n=== Capturing "${animName}" animation ===`);
  console.log(`  Duration: ${duration}ms, Frames: ${frameCount}`);
  console.log(`  Intervals: ${intervals.join(', ')}ms`);

  for (const ms of intervals) {
    // Navigate fresh for each frame
    await page.goto(config.url);
    await page.waitForTimeout(config.postNavWait || 300);

    // Run setup actions
    if (animConfig.setup) {
      for (const action of animConfig.setup) {
        await executeAction(page, action);
      }
    }

    // Trigger animation
    await executeAction(page, animConfig.trigger);

    // Wait for frame time
    if (ms > 0) {
      await page.waitForTimeout(ms);
    }

    // Capture frame
    const frame = await captureFrame(page, ms, animConfig);
    frames.push(frame);

    const verifyInfo = frame.verifyValue ? ` (${animConfig.verify.attribute}=${frame.verifyValue})` : '';
    console.log(`  Captured: ${ms}ms${verifyInfo}`);
  }

  return frames;
}

// Create filmstrip from frames
async function createFilmstrip(frames, outputPath, title, filmstripConfig = {}) {
  if (frames.length === 0) return;

  const scale = filmstripConfig.scale || 0.5;
  const cols = filmstripConfig.cols || Math.min(frames.length, 6);
  const labelHeight = filmstripConfig.labelHeight || 30;
  const padding = 4;
  const bgColor = filmstripConfig.backgroundColor || '#1e1e1e';

  // Parse background color
  const bgRgb = hexToRgb(bgColor);

  // Get dimensions from first frame
  const firstImage = await sharp(frames[0].buffer).metadata();
  const frameWidth = Math.round(firstImage.width * scale);
  const frameHeight = Math.round(firstImage.height * scale);

  const rows = Math.ceil(frames.length / cols);
  const totalWidth = cols * (frameWidth + padding) + padding;
  const totalHeight = rows * (frameHeight + labelHeight + padding) + padding + 40;

  const composites = [];

  // Add title
  const titleSvg = `
    <svg width="${totalWidth}" height="40">
      <text x="${totalWidth / 2}" y="28" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">
        ${escapeXml(title)}
      </text>
    </svg>
  `;
  composites.push({
    input: Buffer.from(titleSvg),
    top: 0,
    left: 0,
  });

  // Add frames with labels
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = padding + col * (frameWidth + padding);
    const y = 40 + padding + row * (frameHeight + labelHeight + padding);

    // Resize frame
    const resizedFrame = await sharp(frame.buffer)
      .resize(frameWidth, frameHeight)
      .toBuffer();

    composites.push({
      input: resizedFrame,
      top: y,
      left: x,
    });

    // Add label
    const labelSvg = `
      <svg width="${frameWidth}" height="${labelHeight}">
        <rect width="${frameWidth}" height="${labelHeight}" fill="#333"/>
        <text x="${frameWidth / 2}" y="20" text-anchor="middle"
              font-family="monospace" font-size="14" fill="white">
          ${frame.ms}ms
        </text>
      </svg>
    `;
    composites.push({
      input: Buffer.from(labelSvg),
      top: y + frameHeight,
      left: x,
    });
  }

  // Create and save filmstrip
  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  console.log(`\nCreated filmstrip: ${outputPath}`);
}

// Print verification report
function printVerificationReport(frames, animConfig) {
  if (!animConfig.verify || frames.every(f => f.verifyValue === null)) {
    console.log('\n  No verification data available.');
    return;
  }

  const tolerance = animConfig.verify.tolerance || 0.05;
  const attr = animConfig.verify.attribute;

  console.log(`\n=== Verification Report ===`);
  console.log(`  Attribute: ${attr}`);
  console.log(`  Tolerance: ${tolerance * 100}%`);
  console.log('');

  let errors = 0;
  const totalDuration = frames[frames.length - 1].ms;

  for (const frame of frames) {
    if (frame.verifyValue === null) {
      console.log(`  ${frame.ms}ms: NO DATA`);
      errors++;
      continue;
    }

    const actual = parseFloat(frame.verifyValue);
    const expected = frame.ms / totalDuration;
    const diff = Math.abs(actual - expected);
    const status = diff <= tolerance ? 'OK' : 'DRIFT';

    if (status !== 'OK') errors++;

    console.log(
      `  ${String(frame.ms).padStart(5)}ms: expected=${expected.toFixed(3)}, ` +
        `actual=${actual.toFixed(3)}, diff=${diff.toFixed(3)} [${status}]`
    );
  }

  console.log('');
  if (errors === 0) {
    console.log('  All frames within tolerance.');
  } else {
    console.log(`  ${errors} frame(s) outside tolerance.`);
  }
}

// Utility: hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 30, g: 30, b: 30 };
}

// Utility: escape XML for SVG
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Main function
async function main() {
  const options = parseArgs();

  // Handle --list
  if (options.list) {
    listConfigs();
    return;
  }

  // Validate config name
  if (!options.configName) {
    console.error('Usage: node scripts/capture-animation-unified.js <config> [animation] [options]');
    console.error('       node scripts/capture-animation-unified.js --list');
    process.exit(1);
  }

  const config = loadConfig(options.configName);

  console.log('=== Unified Animation Capture ===\n');
  console.log(`Config: ${config.name}`);
  console.log(`URL: ${config.url}`);

  // Determine which animations to capture
  const animationNames = options.animationName
    ? [options.animationName]
    : Object.keys(config.animations);

  // Validate animation names
  for (const name of animationNames) {
    if (!config.animations[name]) {
      console.error(`Animation "${name}" not found in config.`);
      console.error(`Available: ${Object.keys(config.animations).join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`Animations: ${animationNames.join(', ')}`);

  // Ensure output directory exists
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  if (config.viewport) {
    await page.setViewportSize(config.viewport);
  }

  // Capture each animation
  for (const animName of animationNames) {
    const animConfig = config.animations[animName];
    const frames = await captureAnimation(page, config, animName, animConfig, options);

    // Create filmstrip
    const filmstripEnabled = config.filmstrip?.enabled !== false;
    if (filmstripEnabled && frames.length > 0) {
      const filmstripPath = path.join(
        options.outputDir,
        `filmstrip-${options.configName}-${animName}.png`
      );
      await createFilmstrip(
        frames,
        filmstripPath,
        `${config.name} - ${animName}`,
        config.filmstrip
      );
    }

    // Verification report
    if (options.verify && animConfig.verify) {
      printVerificationReport(frames, animConfig);
    }
  }

  await browser.close();

  console.log('\n=== Capture complete ===');
  console.log(`Output directory: ${options.outputDir}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
