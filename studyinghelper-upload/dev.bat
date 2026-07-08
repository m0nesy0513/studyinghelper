@echo off
REM StudyingHelper Dev Launcher
REM Uses scripts/dev-launcher.cjs to strip ELECTRON_RUN_AS_NODE
REM before spawning electron, preventing require('electron') bug.
set ELECTRON_RUN_AS_NODE=
npm run dev
pause
