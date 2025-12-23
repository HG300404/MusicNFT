@echo off
echo ========================================
echo   Stopping All Services...
echo ========================================
echo.

echo Killing all Python processes (AI Backend)...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak > nul

echo Killing all Node processes (Frontend + IPFS)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   Starting All Services Fresh...
echo ========================================
echo.

echo [1/3] Starting AI Backend (Port 8000)...
start "AI Backend :8000" cmd /k "cd musicgen-api && venv\Scripts\activate && python main.py"
timeout /t 8 /nobreak > nul

echo [2/3] Starting IPFS Service (Port 3001)...
start "IPFS Service :3001" cmd /k "cd ipfs && npm run dev"
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend (Port 3000)...
start "Frontend :3000" cmd /k "cd music_nft_front_end && npm run dev"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   All Services Restarted Successfully!
echo ========================================
echo.
echo AI Backend:    http://localhost:8000
echo IPFS Service:  http://localhost:3001
echo Frontend:      http://localhost:3000
echo.
echo Changes Applied:
echo  - Safety checker disabled (no more black images)
echo  - Immediate display of generated music and images
echo.
echo Press any key to open Frontend in browser...
pause > nul
start http://localhost:3000
