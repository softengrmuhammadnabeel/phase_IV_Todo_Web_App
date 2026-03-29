@echo off
REM Fully automated Minikube deploy: Helm upgrade, verify pods, port-forward, print URLs.
REM Assumes: Minikube running, backend:latest and frontend:latest already built.

set RELEASE_NAME=todo-bot
set NAMESPACE=default
cd /d "%~dp0"

echo === Minikube auto-deploy (release: %RELEASE_NAME%) ===

echo [1/5] Enabling Minikube Ingress addon...
minikube addons enable ingress

echo [2/5] Deploying/updating Helm release...
helm upgrade --install %RELEASE_NAME% . --namespace %NAMESPACE% --create-namespace --wait --timeout 5m

echo [3/5] Waiting for deployments...
kubectl rollout status deployment -l "app.kubernetes.io/instance=%RELEASE_NAME%" -n %NAMESPACE% --timeout=300s

echo [4/5] Pod status:
kubectl get pods -n %NAMESPACE% -l "app.kubernetes.io/instance=%RELEASE_NAME%" -o wide

echo.
echo [5/5] Starting port-forwards...
taskkill /F /FI "WINDOWTITLE eq *port-forward*todo*" 2>nul
start /B kubectl port-forward -n %NAMESPACE% svc/todo-frontend 3000:3000
start /B kubectl port-forward -n %NAMESPACE% svc/todo-backend 8000:8000
timeout /t 2 /nobreak >nul

echo.
echo --- Access URLs (port-forward) ---
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo.
echo === Deploy complete ===
pause