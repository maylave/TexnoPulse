@echo off
chcp 65001 > nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SnapiServer" /t REG_SZ /d "\"C:\Users\Mi\snapi-app\server\server.exe\"" /f
echo [OK] Бэкенд Snapi успешно добавлен в автозагрузку Windows!
echo Теперь сервер будет автоматически запускаться в фоне при каждом включении ПК.
pause
