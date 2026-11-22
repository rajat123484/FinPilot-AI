@echo off
title FinPilot AI - Backend API (FastAPI)
cd /d "%~dp0backend"
echo ==================================================
echo Starting FinPilot AI Backend Server...
echo API docs will be at: http://127.0.0.1:8000/docs
echo ==================================================
.\venv\Scripts\python.exe run.py
pause
