#!/usr/bin/env bash
# Fully automated Minikube deployment: Helm upgrade, verify pods, print URLs.
# Assumes: Minikube running, frontend/backend images already built (e.g. backend:latest, frontend:latest).

set -e

RELEASE_NAME="todo-bot"
NAMESPACE="default"
CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Minikube auto-deploy (release: $RELEASE_NAME) ==="

# 1) Optional: load local images into Minikube (skip if slow; images may already be in minikube)
echo "[1/6] Ensuring images in Minikube (optional load)..."
for img in backend:latest frontend:latest; do
  if docker image inspect "$img" &>/dev/null; then
    timeout 30 minikube image load "$img" 2>/dev/null || true
  fi
done
eval $(minikube docker-env 2>/dev/null) || true

# 2) Enable Ingress addon (idempotent)
echo "[2/6] Enabling Minikube Ingress addon..."
minikube addons enable ingress

# 3) Deploy/update Helm release (all templates: deployments, services, ingress, etc.)
echo "[3/6] Deploying/updating Helm release..."
helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" --namespace "$NAMESPACE" --create-namespace --wait --timeout 5m

# 4) Rollout status for frontend and backend
echo "[4/6] Waiting for deployments to be ready..."
helm status "$RELEASE_NAME" -n "$NAMESPACE" >/dev/null
kubectl rollout status deployment -l "app.kubernetes.io/instance=$RELEASE_NAME" -n "$NAMESPACE" --timeout=300s

# 5) Verify pods
echo "[5/6] Pod status:"
kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o wide
RUNNING=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" --no-headers 2>/dev/null | grep -c "Running" || echo "0")
TOTAL=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" --no-headers 2>/dev/null | wc -l)
if [ "${TOTAL}" -gt 0 ] && [ "${RUNNING}" -eq "${TOTAL}" ]; then
  echo "All $TOTAL pod(s) are Running."
else
  echo "WARNING: Not all pods are Running. Check with: kubectl get pods -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME"
fi

# 6) Show access URLs (Ingress + port-forward fallback)
echo ""
echo "[6/6] === Access URLs ==="
MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "")
if [ -n "$MINIKUBE_IP" ]; then
  echo "Ingress (host: localhost):"
  echo "  - Frontend:  http://localhost/"
  echo "  - Backend:   http://localhost/api"
  echo ""
  echo "To use Ingress with 'localhost', add this line to your hosts file (run as admin if needed):"
  echo "  $MINIKUBE_IP localhost"
  echo ""
  echo "Or use Minikube IP directly (Host header may be required as 'localhost'):"
  echo "  - Frontend:  http://$MINIKUBE_IP/"
  echo "  - Backend:   http://$MINIKUBE_IP/api"
fi

# Port-forward fallback (optional: start in background so URLs work without hosts edit)
# Start port-forwards so localhost works without editing hosts
echo "Starting port-forwards..."
pkill -f "port-forward.*todo-frontend" 2>/dev/null || true
pkill -f "port-forward.*todo-backend" 2>/dev/null || true
kubectl port-forward -n "$NAMESPACE" svc/todo-frontend 3000:3000 &>/dev/null &
kubectl port-forward -n "$NAMESPACE" svc/todo-backend 8000:8000 &>/dev/null &
sleep 2
echo ""
echo "--- Access URLs (port-forward) ---"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo ""
echo "=== Deploy complete ==="