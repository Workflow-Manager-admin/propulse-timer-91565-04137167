#!/bin/bash
cd /home/kavia/workspace/code-generation/propulse-timer-91565-04137167/pomodoro_frontend_workspace/pomodoro_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

