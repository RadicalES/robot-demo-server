@echo off
setlocal EnableDelayedExpansion
rem ---------------------------------------------------------------------------
rem  scale.bat - start the scale emulator on Windows.
rem
rem  Double-click it, or run it from a command prompt. Settings come from
rem  tools\scale-emulator\scale.conf; anything passed here is added after them
rem  and wins:
rem
rem      scale.bat
rem      scale.bat --port COM4
rem      scale.bat --ramp 0:25:0.5
rem
rem  Python only - no Node - because a demonstration laptop is likelier to have
rem  python than a build toolchain. It needs pyserial:
rem      py -m pip install -r tools\scale-emulator\requirements.txt
rem
rem  While it runs, type a weight and press enter to change what the scale
rem  reads. That is the whole interface.
rem
rem  (C) 2017-2026 Radical Electronic Systems - www.radsys.io
rem ---------------------------------------------------------------------------

cd /d "%~dp0"
set "CONF=tools\scale-emulator\scale.conf"
set "EMULATOR=tools\scale-emulator\emulate.py"

if not exist "%EMULATOR%" (
    echo Cannot find %EMULATOR%.
    echo Run this from the folder it came in.
    goto :fail
)

rem Read KEY=VALUE. "eol=#" skips the comment lines in the file.
set "PORT="
set "PROTOCOL=MICRO-A12E"
set "WEIGHT="
set "RAMP="
set "KIND="
set "UNITS="
set "BAUD="
if exist "%CONF%" (
    for /f "usebackq eol=# tokens=1,2 delims==" %%A in ("%CONF%") do (
        set "KEY=%%A"
        set "VAL=%%B"
        if /i "!KEY!"=="PORT"     set "PORT=!VAL!"
        if /i "!KEY!"=="PROTOCOL" set "PROTOCOL=!VAL!"
        if /i "!KEY!"=="WEIGHT"   set "WEIGHT=!VAL!"
        if /i "!KEY!"=="RAMP"     set "RAMP=!VAL!"
        if /i "!KEY!"=="KIND"     set "KIND=!VAL!"
        if /i "!KEY!"=="UNITS"    set "UNITS=!VAL!"
        if /i "!KEY!"=="BAUD"     set "BAUD=!VAL!"
    )
)

rem A Linux device path in the config is the usual thing to find on a Windows
rem machine, because the file came from a bench where that was right.
if defined PORT (
    echo %PORT% | findstr /b /c:"/dev/" >nul
    if not errorlevel 1 (
        echo The port in %CONF% is %PORT%, which is a Linux name.
        echo On Windows it is a COM port - set PORT=COM3 in that file, or run:
        echo     scale.bat --port COM3
        goto :fail
    )
)

set "ARGS=--protocol %PROTOCOL%"
if defined PORT   set "ARGS=!ARGS! --port %PORT%"
if defined BAUD   set "ARGS=!ARGS! --baud %BAUD%"
if defined RAMP   (set "ARGS=!ARGS! --ramp %RAMP%") else (if defined WEIGHT set "ARGS=!ARGS! --weight %WEIGHT%")
if defined KIND   set "ARGS=!ARGS! --kind %KIND%"
if defined UNITS  set "ARGS=!ARGS! --units %UNITS%"

rem Which python, in the order that respects what somebody has set up.
rem
rem An activated virtual environment comes first: VIRTUAL_ENV is what activate
rem sets, and pyserial is very often installed there rather than system-wide.
rem "py -3" is the Windows launcher and it ignores a venv entirely - it was
rem tried first here, which is exactly how a machine with a working venv gets
rem told pyserial is not installed.
rem
rem Then a venv sitting in this folder even if nobody activated it, then
rem whatever "python" is on the PATH, and the launcher last.
set "PY="
if defined VIRTUAL_ENV if exist "%VIRTUAL_ENV%\Scripts\python.exe" set "PY=%VIRTUAL_ENV%\Scripts\python.exe"
if not defined PY if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"
if not defined PY if exist "venv\Scripts\python.exe"  set "PY=venv\Scripts\python.exe"
if not defined PY python --version >nul 2>&1 && set "PY=python"
if not defined PY py -3 --version >nul 2>&1 && set "PY=py -3"
if not defined PY (
    echo No python found.
    echo Install it from python.org, tick "Add to PATH", then:
    echo     py -m pip install -r tools\scale-emulator\requirements.txt
    goto :fail
)

echo scale: %PROTOCOL% on %PORT%   [%PY%]
%PY% "%EMULATOR%" %ARGS% %*
if errorlevel 1 goto :fail
endlocal
exit /b 0

:fail
echo.
pause
endlocal
exit /b 1
