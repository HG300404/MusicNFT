@echo off
echo ========================================
echo   Browser Refresh Helper
echo ========================================
echo.
echo Please follow these steps:
echo.
echo 1. METAMASK - Check Network
echo    ------------------------
echo    - Open MetaMask extension
echo    - Check top-left corner shows "Sepolia test network"
echo    - If not, click dropdown and select "Sepolia test network"
echo.
echo 2. HARD REFRESH BROWSER
echo    ---------------------
echo    - Go to http://localhost:3000
echo    - Press: Ctrl + Shift + R
echo    - OR: Ctrl + F5
echo    - This clears cache and reloads
echo.
echo 3. CLEAR LOCALSTORAGE
echo    -------------------
echo    - Press F12 to open DevTools
echo    - Go to "Application" tab (or "Storage" in Firefox)
echo    - Click "Local Storage" in left sidebar
echo    - Click "http://localhost:3000"
echo    - Right-click and select "Clear"
echo    - OR run in Console tab:
echo      localStorage.clear()
echo      location.reload()
echo.
echo ========================================
echo   Opening localhost:3000...
echo ========================================
timeout /t 2 /nobreak > nul
start http://localhost:3000

echo.
echo After completing steps above, try minting again!
echo.
pause
