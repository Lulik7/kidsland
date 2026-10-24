@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Kidsland

echo [1/3] Запускаю базу данных...
docker compose up -d
if errorlevel 1 (
  echo.
  echo Не получилось запустить базу. Откройте Docker Desktop, дождитесь "Engine running" и запустите этот файл снова.
  pause
  exit /b 1
)

echo [2/3] Проверяю зависимости...
call npm.cmd install --no-audit --no-fund
if errorlevel 1 (
  pause
  exit /b 1
)

echo [3/3] Запускаю сервер и сайт. Не закрывайте это окно, для остановки нажмите Ctrl+C.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:5173"
call npm.cmd run dev
pause
