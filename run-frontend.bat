@echo off
chcp 65001 >nul
title Khởi động Frontend - Hệ thống Quản lý Huấn luyện Ngựa đua

echo =======================================================================
echo    KIỂM TRA VÀ KHỞI ĐỘNG HỆ THỐNG FRONTEND MÃ TRƯỜNG
echo =======================================================================
echo.

:: 1. Kiểm tra xem npm đã có trong PATH chưa
where npm >nul 2>nul
if %errorlevel% equ 0 goto :found_npm

:: 2. Nếu chưa có trong PATH, tìm trong các thư mục cài đặt mặc định của Node.js
if exist "C:\Program Files\nodejs\npm.cmd" (
    echo [THÔNG BÁO] Tìm thấy Node.js tại C:\Program Files\nodejs
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :found_npm
)

if exist "C:\Program Files (x86)\nodejs\npm.cmd" (
    echo [THÔNG BÁO] Tìm thấy Node.js tại C:\Program Files (x86)\nodejs
    set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    goto :found_npm
)

if exist "%LOCALAPPDATA%\Programs\node\npm.cmd" (
    echo [THÔNG BÁO] Tìm thấy Node.js tại %LOCALAPPDATA%\Programs\node
    set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
    goto :found_npm
)

:: 3. Nếu chưa cài Node.js trên máy này
echo [LỖI] Máy tính này CHƯA CÀI ĐẶT Node.js (npm)!
echo.
echo =======================================================================
echo    HƯỚNG DẪN KHẮC PHỤC (CHỈ CẦN LÀM 1 LẦN DUY NHẤT):
echo =======================================================================
echo 1. Tải Node.js bản LTS miễn phí tại: https://nodejs.org/
echo 2. Cài đặt file .msi vừa tải về (Bấm Next liên tục, để mặc định).
echo 3. Sau khi cài xong, TẮT HẾT cửa sổ VS Code / Terminal hiện tại và MỞ LẠI.
echo 4. Chạy lại file này hoặc gõ lệnh: npm install
echo =======================================================================
echo.
echo Đang mở trình duyệt đến trang tải Node.js...
start https://nodejs.org/en/download/
pause
exit /b 1

:found_npm
echo [OK] Đã tìm thấy Node.js & npm trên máy tính!
echo.
node -v
npm -v
echo.

:: Di chuyển vào thư mục frontend
cd /d "%~dp0frontend"

:: Kiểm tra node_modules, nếu chưa có thì tự động npm install
if not exist "node_modules\" (
    echo [BƯỚC 1/2] Đang cài đặt thư viện cần thiết (npm install)... Vui lòng đợi trong giây lát...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [LỖI] Quá trình npm install gặp trục trặc. Vui lòng kiểm tra kết nối mạng.
        pause
        exit /b %errorlevel%
    )
) else (
    echo [BƯỚC 1/2] Thư viện frontend đã được cài đặt sẵn.
)

echo.
echo [BƯỚC 2/2] Đang khởi chạy máy chủ giao diện (npm run dev)...
echo Trình duyệt sẽ tự động mở tại http://localhost:3000
echo.
call npm run dev

pause
