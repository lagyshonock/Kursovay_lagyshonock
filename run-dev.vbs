' Делегирует в dev-shell.vbs (поиск node.exe, отдельное окно).
Option Explicit
Dim sh, fso, base
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run "wscript.exe //nologo """ & base & "\dev-shell.vbs""", 1, False
