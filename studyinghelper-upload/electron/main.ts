// Fix for Electron bug #49034 on Windows:
// When ELECTRON_RUN_AS_NODE is set (even to empty string), require('electron')
// returns the npm package path instead of the built-in Electron API.
// Delete it before any require('electron') calls.
delete process.env.ELECTRON_RUN_AS_NODE;

// All type imports first
import type { BrowserWindow as BrowserWindowType, HandlerDetails, App } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { initDatabase, startAutoSave, closeDatabase } from './database/connection'
import { runMigrations } from './database/migrations'
import { registerAllHandlers } from './ipc-handlers'
import { resourceRepo } from './database/repositories/resources'
import { startPolling, stopPolling } from './lib/fetcher/rssPolling'

// Electron runtime APIs — must use require(), not import.
// import { app } from 'electron' gets incorrectly transformed by Vite/Rollup
// into `const electron = require("electron")` which on Windows resolves to
// the npm package (a path string) instead of the built-in Electron module.
// See: https://github.com/electron/electron/issues/49034
const { app, BrowserWindow, shell, protocol } = require('electron') as {
  app: App
  BrowserWindow: typeof BrowserWindowType
  shell: Electron.Shell
  protocol: Electron.Protocol
}

let mainWindow: BrowserWindowType | null = null

function createWindow(): void {
  const isDev = !app.isPackaged

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'StudyingHelper',
    backgroundColor: '#020617',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details: HandlerDetails) => {
    // Prefer Edge on Windows; fall back to system default browser
    if (process.platform === 'win32') {
      exec(`start "" msedge "${details.url}"`)
    } else {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// Enable Chromium built-in PDF viewer toolbar (pen, highlighter, text)
app.commandLine.appendSwitch('enable-features', 'PdfViewerUpdate')

// Register custom protocol scheme — MUST be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: 'pdf', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } },
])

app.whenReady().then(async () => {
  app.setAppUserModelId('com.studyinghelper.app')

  const db = await initDatabase()
  runMigrations(db)
  startAutoSave()

  registerAllHandlers()

  // Start RSS background polling — fetches all active feeds every 30 min
  startPolling()

  // Custom protocol: pdf://<resourceId> → serves the stored PDF file.
  // Chromium's built-in PDF viewer (same as Edge) handles rendering,
  // including native annotation tools (pen, highlighter, text notes).
  protocol.handle('pdf', (request) => {
    const resourceId = request.url.replace('pdf://', '').replace(/\/$/, '')
    const resource = resourceRepo.get(resourceId)
    if (!resource?.stored_path || !fs.existsSync(resource.stored_path)) {
      return new Response('PDF not found', { status: 404 })
    }
    const buffer = fs.readFileSync(resource.stored_path)
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline' },
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  stopPolling()
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
