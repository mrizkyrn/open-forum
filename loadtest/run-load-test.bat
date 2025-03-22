@REM filepath: c:\Users\mrizk\Projects\Thesis\upnvj-forum\load-tests\run-load-test.bat
@echo off
setlocal EnableDelayedExpansion

REM ========================================================================
REM UPNVJ Forum Load Test Runner v1.0
REM ========================================================================

REM =========================== CONFIGURATION ==============================
set "MONITOR_WAIT=2"
set "COMPLETION_WAIT=5"
set "DEFAULT_DURATION=120"
set "RESULTS_ROOT=results"
set "CONFIGS_DIR=configs"
set "SCRIPTS_DIR=scripts"
REM ========================================================================

REM ========================== CHECK ARGUMENTS =============================
if "%1"=="" (
    echo [ERROR] Missing test name parameter
    echo.
    echo Usage: run-load-test.bat ^<test-name^> [phase-name] [options]
    echo.
    echo Available tests:
    for %%f in (%CONFIGS_DIR%\*.yml) do echo   - %%~nf
    echo.
    exit /b 1
)

REM ========================= SET TEST PARAMETERS =========================
set "TEST_NAME=%1"
set "PHASE_NAME=%2"
if "%PHASE_NAME%"=="" set "PHASE_NAME=all"
set "CONFIG_FILE=%CONFIGS_DIR%\%TEST_NAME%.yml"
set "DURATION=%3"
if "%DURATION%"=="" set "DURATION=%DEFAULT_DURATION%"

REM ====================== VALIDATE CONFIGURATION =========================
if not exist "%CONFIG_FILE%" (
    echo [ERROR] Config file %CONFIG_FILE% not found.
    echo.
    echo Available configs:
    for %%f in (%CONFIGS_DIR%\*.yml) do echo   - %%~nf
    exit /b 1
)

REM ====================== PREPARE DIRECTORY STRUCTURE ====================
echo [INFO] Setting up test environment...
for %%d in (metrics reports summary latency) do (
    if not exist "%RESULTS_ROOT%\%%d\%TEST_NAME%" (
        mkdir "%RESULTS_ROOT%\%%d\%TEST_NAME%" 2>NUL
        if !errorlevel! neq 0 (
            echo [ERROR] Failed to create directory %RESULTS_ROOT%\%%d\%TEST_NAME%
            exit /b 1
        )
    )
)

REM ======================== SETUP SOCKET LISTENER ========================
echo [INFO] Starting socket listener...
start "Socket Listener" cmd /c "node %SCRIPTS_DIR%\socket-listener.js %TEST_NAME% %PHASE_NAME%"

echo [INFO] Waiting for socket listener to initialize...
timeout /t 5 > NUL

REM ======================== START RESOURCE MONITORING ====================
echo [INFO] Starting resource monitoring...
start "Resource Monitor" cmd /c "node %SCRIPTS_DIR%\monitor-resources.js %TEST_NAME% %PHASE_NAME% %DURATION%"

echo [INFO] Waiting for monitors to initialize... (%MONITOR_WAIT%s)
timeout /t %MONITOR_WAIT% > NUL

REM =========================== RUN ARTILLERY TEST ========================
echo.
echo STARTING LOAD TEST: %TEST_NAME% (%PHASE_NAME%)                     
echo Test will run for approximately %DURATION% seconds                  
echo.

set "REPORT_PATH=%RESULTS_ROOT%\reports\%TEST_NAME%\%PHASE_NAME%-report.json"
call artillery run --output "%REPORT_PATH%" "%CONFIG_FILE%"

if %errorlevel% neq 0 (
    echo [ERROR] Artillery test failed with error code %errorlevel%
    exit /b %errorlevel%
)

REM ========================= WAIT FOR COMPLETION =========================
echo.
echo [INFO] Test completed. Finalizing results... (%COMPLETION_WAIT%s)
timeout /t %COMPLETION_WAIT% > NUL

REM ========================= GENERATE FINAL REPORTS ======================
echo [INFO] Generating test reports...

REM Generate Artillery HTML report
call artillery report "%REPORT_PATH%"

REM Generate our custom summary report
node %SCRIPTS_DIR%\generate-report.js %TEST_NAME% %PHASE_NAME%

REM ============================= TEST SUMMARY ============================
echo.
echo TEST COMPLETE: %TEST_NAME% (%PHASE_NAME%)                          
echo Reports available at:                                               
echo  - Summary: %RESULTS_ROOT%\reports\%TEST_NAME%-summary-report.md    
echo  - Artillery: %REPORT_PATH%.html                                    
echo.

REM ============================= CLEANUP =================================
echo [INFO] Test run completed successfully.
endlocal
exit /b 0