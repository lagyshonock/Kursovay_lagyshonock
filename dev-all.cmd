@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call :resolve_node
if errorlevel 1 goto :eof

start "KU site — dev (бот)" cmd.exe /k "cd /d ""%~dp0"" && ""%NODE_EXE%"" scripts\dev-runner.mjs --bot"
exit /b 0

:resolve_node
if defined NODE_EXE if exist "%NODE_EXE%" exit /b 0

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  exit /b 0
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
  set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
  exit /b 0
)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
  set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
  exit /b 0
)
for /f "delims=" %%I in ('where node 2^>nul') do (
  set "NODE_EXE=%%I"
  exit /b 0
)
echo [ku-site] Node.js не найден. Установите Node LTS или: setx NODE_EXE "C:\полный\путь\node.exe"
pause
exit /b 1
