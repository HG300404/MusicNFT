@echo off
echo ========================================
echo   Music NFT Platform - Starting All Services
echo ========================================
echo.

echo [1/3] Starting AI Backend (Dev 2)...
start "AI Backend :8000" cmd /k "cd musicgen-api && venv\Scripts\activate && python main.py"
timeout /t 5 /nobreak > nul

echo [2/3] Starting IPFS Service (Dev 3)...
start "IPFS Service :3001" cmd /k "cd ipfs && npm run dev"
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend (Dev 4)...
start "Frontend :3000" cmd /k "cd music_nft_front_end && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo AI Backend:    http://localhost:8000
echo IPFS Service:  http://localhost:3001
echo Frontend:      http://localhost:3000
echo.
echo Smart Contract (Sepolia):
echo Address: 0xbbA15182FF395Af1756d762A5001B2f07631f575
echo Explorer: https://sepolia.etherscan.io/address/0xbbA15182FF395Af1756d762A5001B2f07631f575
echo.
echo Press any key to open Frontend in browser...
pause > nul
start http://localhost:3000
