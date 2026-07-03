# 🧠 TaskAI — AI-Powered Task Manager

A full-stack Django + React application that uses **NLP to auto-categorize and prioritize tasks** in real time. Built for portfolio showcase with production-ready architecture.

---

## ✨ Features

| Feature | Detail |
|---|---|
| **NLP Auto-Categorization** | spaCy + keyword scoring assigns tasks to categories (Dev, Design, Marketing…) with confidence scores |
| **Smart Priority Scoring** | Combines urgency keyword signals, deadline proximity, and user preference model |
| **Live AI Feedback** | As you type a task title, the UI shows category suggestion, priority score bar, keywords, and subtask ideas |
| **Smart Suggestions** | Time estimates, subtask breakdown, and tag suggestions powered by the NLP engine |
| **AI Insights Dashboard** | Charts showing completion rate, category distribution, priority breakdown, and AI recommendations |
| **Async Processing** | Celery + Redis handles NLP in the background — API stays fast |
| **Board + List Views** | Kanban-style board grouped by status, or flat filterable list |
| **JWT Auth** | Secure register / login / refresh / logout flow |
| **REST API + Swagger** | Full documented API at `/api/docs/` |
| **Docker Ready** | Single `docker-compose up` starts everything |

---

## 🗂 Project Structure

```
ai-task-manager/
├── backend/                    # Django REST API
│   ├── config/
│   │   ├── settings.py         # All settings, env-driven
│   │   ├── urls.py             # Root URL config
│   │   ├── celery.py           # Celery + Beat schedules
│   │   └── wsgi.py
│   ├── users/                  # Custom user model + JWT auth
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── tasks/                  # Core task CRUD + filtering
│   │   ├── models.py           # Task, Category, Tag, Comment, Activity
│   │   ├── serializers.py
│   │   ├── views.py            # TaskViewSet with bulk ops + stats
│   │   ├── filters.py          # Advanced django-filter config
│   │   ├── admin.py
│   │   └── urls.py
│   ├── ai_backend/             # NLP engine + AI endpoints
│   │   ├── nlp_engine.py       # Core NLP: categorize, score, extract, suggest
│   │   ├── tasks.py            # Celery async tasks
│   │   ├── views.py            # /analyze /suggestions /insights endpoints
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── setup.sh                # One-command local setup
│   └── .env.example
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx             # Router + auth guards
│   │   ├── main.jsx            # React root + QueryClient
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TasksPage.jsx   # Board + list view + filters
│   │   │   ├── InsightsPage.jsx # AI analytics charts
│   │   │   └── ProfilePage.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar/        # Nav + user info
│   │   │   ├── Dashboard/      # Stats + pie chart + AI recs
│   │   │   ├── TaskCard/       # Card with priority bar + AI badge
│   │   │   ├── TaskForm/       # Create/edit + live AI panel
│   │   │   ├── AIPanel/        # Live NLP feedback widget
│   │   │   └── ui/             # Button, Input, Modal, Badge
│   │   ├── hooks/
│   │   │   ├── useTasks.js     # React Query hooks for all task ops
│   │   │   ├── useAI.js        # Live analysis + insights hooks
│   │   │   └── useDebounce.js
│   │   ├── store/
│   │   │   ├── authStore.js    # Zustand auth state
│   │   │   └── taskStore.js    # Filters, view, selected tasks
│   │   ├── services/
│   │   │   └── api.js          # Axios instance + all endpoint fns
│   │   ├── utils/
│   │   │   └── helpers.js      # Priority/status maps, date formatters
│   │   └── styles/
│   │       └── globals.css     # Tailwind + custom design tokens
│   ├── Dockerfile
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── docker-compose.yml          # Full stack: db + redis + backend + celery + frontend
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
git clone <your-repo-url> ai-task-manager
cd ai-task-manager

# Copy and edit env (change SECRET_KEY at minimum)
cp backend/.env.example backend/.env

# Start everything
docker-compose up --build

# In another terminal, create a superuser
docker-compose exec backend python manage.py createsuperuser
```

Open **http://localhost** for the app, **http://localhost:8000/api/docs/** for Swagger.

---

### Option B — Local development

#### Backend

```bash
cd backend

# Run setup script (creates venv, installs deps, migrates, downloads spaCy model)
bash setup.sh

# Activate env
source venv/bin/activate

# Start Django
python manage.py runserver

# Start Celery worker (separate terminal)
celery -A config worker --loglevel=info

# Start Celery Beat scheduler (separate terminal)
celery -A config beat --loglevel=info
```

#### Frontend

```bash
cd frontend

cp .env.example .env        # VITE_API_URL=http://localhost:8000/api/v1

npm install
npm run dev
```

Open **http://localhost:3000**

---

## 🧠 How the NLP Works

```
User types task title  ──►  Debounced (600ms)
        │
        ▼
POST /api/v1/ai/analyze/
        │
        ▼
NLPEngine.process_task()
  ├── categorize()        ─── keyword × bigram scoring against 8 categories
  ├── score_priority()    ─── urgency keywords + deadline delta + user model
  ├── extract_keywords()  ─── spaCy noun chunks + POS filtering (fallback: regex)
  ├── analyze_sentiment() ─── positive/negative word counting
  └── generate_suggestions() ─ time estimates, subtask patterns, tag hints
        │
        ▼
Live AI panel updates in the task form
        │
        ▼
On save → Celery queues process_task_nlp.delay(task.id)
        │
        ▼
Category auto-assigned + DB updated (nlp_processed=True)
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register/` | Register + get JWT tokens |
| `POST` | `/api/v1/auth/login/` | Login + get JWT tokens |
| `GET`  | `/api/v1/tasks/` | List tasks (filterable, searchable, paginated) |
| `POST` | `/api/v1/tasks/` | Create task (triggers async NLP) |
| `PATCH`| `/api/v1/tasks/{id}/` | Update task |
| `POST` | `/api/v1/tasks/bulk_update/` | Bulk status/priority update |
| `GET`  | `/api/v1/tasks/stats/` | Dashboard statistics |
| `POST` | `/api/v1/ai/analyze/` | Live NLP analysis (no DB write) |
| `POST` | `/api/v1/ai/suggestions/` | Smart suggestions for a task |
| `GET`  | `/api/v1/ai/insights/` | User productivity insights |
| `GET`  | `/api/schema/` | OpenAPI schema |
| `GET`  | `/api/docs/` | Swagger UI |

Full filter params for `GET /api/v1/tasks/`:
```
?status=pending&priority=1,2&category=3&search=bug&is_overdue=true
&due_before=2024-12-31&ordering=-priority
```

---

## 🛠 Tech Stack

**Backend**
- Django 4.2 + Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- spaCy `en_core_web_sm` for NLP
- scikit-learn (TF-IDF available for extension)
- Celery + Redis for async task processing
- PostgreSQL (SQLite for dev)
- Swagger/OpenAPI via `drf-spectacular`

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark theme with custom design tokens)
- Zustand (global state)
- TanStack Query v5 (server state + caching)
- React Hook Form
- Framer Motion (animations)
- Recharts (data visualizations)
- Axios with JWT interceptors + auto-refresh

---

## 🌐 Deployment (Portfolio)

### Render.com

1. Create a **Web Service** for the backend (`backend/` root, `gunicorn config.wsgi:application`)
2. Create a **Static Site** for the frontend (`frontend/` root, build command `npm run build`, publish dir `dist`)
3. Add a **PostgreSQL** database and **Redis** instance
4. Set all env variables from `.env.example`

### Railway / Fly.io

Use the provided `Dockerfile` in each directory. Both platforms auto-detect Docker.

---

## 📸 Portfolio Notes

This project demonstrates:
- **Full-stack architecture** — Django API + React SPA, cleanly separated
- **AI/ML integration** — Real NLP pipeline, not just GPT API calls
- **Production patterns** — Async tasks, JWT refresh, pagination, filters, migrations
- **Clean code** — Each concern in its own file, typed serializers, documented endpoints
- **Deployment ready** — Docker Compose, gunicorn, whitenoise, env-based config

---

## License

MIT — free to use, modify, and showcase in your portfolio.
#   A i T a s k M a n a g e r  
 