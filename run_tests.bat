@echo off
title FinPilot AI - Integration Test Suite
cd /d "%~dp0backend"
echo ==================================================
echo Executing FinPilot AI Automated Test Suite...
echo ==================================================
.\venv\Scripts\python.exe test_api.py
pause
