/**
 * Dev Launcher — strips ELECTRON_RUN_AS_NODE before spawning electron-vite.
 *
 * On Windows, VSCode's integrated terminal inherits ELECTRON_RUN_AS_NODE=1
 * from VSCode itself (an Electron app). When electron-vite spawns electron.exe,
 * the env var causes electron to run in "Node mode" where require('electron')
 * returns the npm package path instead of the built-in Electron API.
 *
 * This launcher explicitly removes the env var from the child process
 * environment so electron.exe starts in "Electron mode" correctly.
 */
const { spawn } = require('child_process');
const path = require('path');

// Build clean environment — copy everything except ELECTRON_RUN_AS_NODE
const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

console.log('[dev-launcher] Stripping ELECTRON_RUN_AS_NODE from child process environment');
console.log('[dev-launcher] Starting electron-vite dev...');

const child = spawn(
  'npx electron-vite dev',
  {
    stdio: 'inherit',
    env: cleanEnv,
    cwd: path.resolve(__dirname, '..'),
    shell: true,
  }
);

child.on('close', (code) => {
  process.exit(code ?? 0);
});
