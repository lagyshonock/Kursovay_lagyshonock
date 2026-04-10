@echo off
REM Только API + Vite (без бота), отдельное окно.
cd /d "%~dp0"
wscript.exe //nologo "%~dp0dev-shell.vbs"
