# Todo App with AI Chatbot Assistant

A full-stack Todo application with an AI-powered chatbot for managing tasks using natural language. Deployed locally using Kubernetes (Minikube) with modern DevOps practices.

---

## ✨ Features
- Full-stack Todo management (CRUD)
- Next.js frontend + FastAPI backend
- JWT authentication
- AI chatbot for natural language commands
- Kubernetes deployment with Helm

### 🤖 AI Commands
- "Add a task to buy groceries"
- "Show my tasks"
- "Mark grocery task as done"
- "Update grocery task"
- "Delete the meeting task"

---

## 🛠️ Tech Stack
- **Frontend:** Next.js, TypeScript, Tailwind CSS  
- **Backend:** FastAPI, SQLModel, Pydantic  
- **Database:** PostgreSQL (Neon)  
- **AI:** OpenAI / Gemini APIs  
- **DevOps:** Docker, Kubernetes (Minikube), Helm  

---

## 📂 Structure

project-root/
├── frontend/
├── backend/
├── charts/
├── dockerfiles/
└── specs/


---

## 🚀 Quick Start

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
````

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Docker

```bash
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

docker run -p 8000:8000 todo-backend:latest
docker run -p 3000:3000 todo-frontend:latest
```

---

## ☸️ Kubernetes (Minikube)

```bash
minikube start
eval $(minikube docker-env)

docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

helm upgrade todo ./charts
```

### Access App

```bash
kubectl port-forward svc/todo-frontend 3000:3000
kubectl port-forward svc/todo-backend 8000:8000
```

---


## 🧪 Testing

```bash
cd backend && pytest
cd frontend && npm test
```

---

## 🔒 Security

* JWT authentication
* Input validation (Pydantic)
* Secure environment configs
* 
---

## 📄 License

MIT License

---

Built for Hackathon II – Phase IV 🚀

