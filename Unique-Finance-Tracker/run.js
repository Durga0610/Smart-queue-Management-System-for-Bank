const { execSync, spawn } = require('child_process');
const path = require('path');

// 1. Dynamically resolve the absolute database path in an escape-safe, forward-slashed format
const rootDir = __dirname;
const dbPath = path.join(rootDir, 'sqlite.db').replace(/\\/g, '/');

// 2. Configure system environment variables dynamically
process.env.DATABASE_URL = dbPath;
process.env.PORT = '5000';
process.env.BASE_PATH = '/';

console.log('==================================================');
console.log('🚀  QueueLess System-Agnostic Launch Script  🚀');
console.log('==================================================');
console.log(`📂 Work Directory:  ${rootDir}`);
console.log(`🗄️ Database Path:   ${dbPath}`);
console.log(`🔌 Server Port:     5000`);
console.log('==================================================\n');

// Helper to run commands synchronously
function runCmd(cmd, desc) {
  console.log(`🔹 [Task] ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: rootDir, env: process.env });
    console.log(`✅ [Success] ${desc} complete.\n`);
  } catch (err) {
    console.error(`❌ [Error] ${desc} failed!`);
    process.exit(1);
  }
}

// 3. Install packages if they are not already up-to-date
runCmd('pnpm install', 'Ensuring project packages are installed');

// 4. Sync Database Schema using Drizzle
runCmd('pnpm --filter @workspace/db run push', 'Syncing Database Schema');

// 5. Compile and bundle the Vite Frontend
runCmd('pnpm --filter ./frontend run build', 'Compiling Frontend Static Assets');

// 6. Launch Unified Express Server
console.log('🔹 [Task] Launching Unified Server...');
const server = spawn('pnpm', ['--filter', './backend', 'run', 'dev'], {
  stdio: 'inherit',
  cwd: rootDir,
  shell: true,
  env: process.env
});

server.on('exit', (code) => {
  console.log(`\n🛑 Server process terminated with exit code ${code || 0}`);
  process.exit(code || 0);
});
