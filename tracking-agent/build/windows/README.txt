WinSW (Windows Service Wrapper)
================================

To complete the Windows build, you need to download WinSW:

1. Download WinSW from: https://github.com/winsw/winsw/releases
2. Get the latest version (e.g., WinSW-x64.exe)
3. Rename it to: winsw.exe
4. Place it in this directory: tracking-agent/build/windows/winsw.exe

After adding winsw.exe:
- Run: npm run build:package
- This will create a complete installer package in dist/

File size: ~2 MB
License: MIT
Website: https://github.com/winsw/winsw
