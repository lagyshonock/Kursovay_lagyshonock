' API + Vite + бот — через dev-shell.vbs all.
Option Explicit
Dim sh, fso, base
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run "wscript.exe //nologo """ & base & "\dev-shell.vbs"" all", 1, False
