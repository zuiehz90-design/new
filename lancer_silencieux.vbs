' Lance Nour sans fenêtre de console (le serveur tourne en arrière-plan).
' Pour arrêter : Gestionnaire des tâches -> terminer node.exe, ou relancez lancer.bat
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("Wscript.Shell")
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run "cmd /c """ & baseDir & "\lancer.bat""", 0, False
