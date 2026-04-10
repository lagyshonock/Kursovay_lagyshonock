@echo off
REM Самый надёжный запуск из Cursor: только wscript — откроется отдельное окно с полным путём к node (dev-shell.vbs).
cd /d "%~dp0"
wscript.exe //nologo "%~dp0dev-shell.vbs" all
