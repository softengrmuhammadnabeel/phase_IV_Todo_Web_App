#!/bin/bash

# Helper script for local deployment with Minikube
# This script builds the Docker images and deploys the application to Minikube

set -e

echo "Starting local deployment to Minikube..."

# Make sure Minikube is running
if ! minikube status &> /dev/null; then
    echo "Minikube is not running. Starting Minikube..."
    minikube start
fi

# Enable ingress addon in Minikube
echo "Enabling ingress addon in Minikube..."
minikube addons enable ingress

# Set Docker environment to use Minikube's Docker daemon
echo "Setting Docker environment to Minikube..."
eval $(minikube docker-env)

# Build backend image
echo "Building backend image..."
cd ../backend
docker build -t backend:latest .

# Build frontend image
echo "Building frontend image..."
cd ../frontend
docker build -t frontend:latest .

# Go back to the Helm chart directory
cd ../todoBot

# Install or upgrade the Helm release
echo "Installing/upgrading Helm release..."
helm upgrade --install todo-bot . --namespace default --create-namespace

echo "Deployment completed!"
echo "Access the application at: http://$(minikube ip)"
echo "You can also access it via: http://localhost (if your /etc/hosts is configured)"

# Show status
echo "Checking deployment status..."
kubectl get pods,services,ingress -n default