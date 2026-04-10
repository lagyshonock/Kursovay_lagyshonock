' Запуск dev в отдельном cmd; полный путь к node.exe (реестр, Program Files) — обход «Отказано в доступе» в песочнице Cursor.
' Аргумент: all — с ботом (как dev:all). Иначе только API + Vite.
Option Explicit

Dim sh, fso, base, nodeExe, botSuffix, nodePart, cmdLine

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = base

botSuffix = ""
If WScript.Arguments.Count >= 1 Then
  If LCase(Trim(WScript.Arguments(0))) = "all" Then botSuffix = " --bot"
End If

nodeExe = ResolveNodeExe(fso, sh)
If LCase(nodeExe) = "node" Then
  nodePart = "node"
Else
  nodePart = """" & Replace(nodeExe, """", """""") & """"
End If

cmdLine = "cmd.exe /k cd /d """ & base & """ && " & nodePart & " scripts\dev-runner.mjs" & botSuffix
sh.Run cmdLine, 1, False

Function ResolveNodeExe(fso, sh)
  Dim envNode, regPath, cand, pf, la
  envNode = sh.Environment("PROCESS")("NODE_EXE")
  If Len(envNode) > 0 Then
    If fso.FileExists(envNode) Then
      ResolveNodeExe = envNode
      Exit Function
    End If
  End If

  On Error Resume Next
  regPath = sh.RegRead("HKLM\SOFTWARE\Node.js\InstallPath")
  If Len(regPath) = 0 Then regPath = sh.RegRead("HKLM\SOFTWARE\WOW6432Node\Node.js\InstallPath")
  On Error GoTo 0
  If Len(regPath) > 0 Then
    If Right(regPath, 1) <> "\" Then regPath = regPath & "\"
    cand = regPath & "node.exe"
    If fso.FileExists(cand) Then
      ResolveNodeExe = cand
      Exit Function
    End If
  End If

  pf = sh.ExpandEnvironmentStrings("%ProgramFiles%")
  cand = pf & "\nodejs\node.exe"
  If fso.FileExists(cand) Then
    ResolveNodeExe = cand
    Exit Function
  End If

  cand = sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe"
  If fso.FileExists(cand) Then
    ResolveNodeExe = cand
    Exit Function
  End If

  la = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%")
  cand = la & "\Programs\node\node.exe"
  If fso.FileExists(cand) Then
    ResolveNodeExe = cand
    Exit Function
  End If

  ResolveNodeExe = "node"
End Function
