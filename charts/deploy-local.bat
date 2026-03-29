@echo off
REM Helper script for local deployment with Minikube on Windows
REM This script builds the Docker images and deploys the application to Minikube

echo Starting local deployment to Minikube...

REM Make sure Minikube is running
minikube status >nul 2>&1
if errorlevel 1 (
    echo Minikube is not running. Starting Minikube...
    minikube start
)

REM Enable ingress addon in Minikube
echo Enabling ingress addon in Minikube...
minikube addons enable ingress

REM Set Docker environment to use Minikube's Docker daemon
echo Setting Docker environment to Minikube...
for /f %%i in ('minikube docker-env') do @%%i

REM Build backend image
echo Building backend image...
cd ..\backend
docker build -t backend:latest .

REM Build frontend image
echo Building frontend image...
cd ..\frontend
docker build -t frontend:latest .

REM Go back to the Helm chart directory
cd ..\todoBot

REM Install or upgrade the Helm release
echo Installing/upgrading Helm release...
helm upgrade --install todo-bot . --namespace default --create-namespace

echo Deployment completed!
echo Access the application at: http://localhost
echo You can also access it via: http://%%MINIKUBE_IP%%

REM Show status
echo Checking deployment status...
kubectl get pods,services,ingress -n default