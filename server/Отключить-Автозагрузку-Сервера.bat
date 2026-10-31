@echo off
chcp 65001 > nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SnapiServer" /f 2>nul
echo [OK] Бэкенд Snapi удален из автозагрузки Windows.
pause
