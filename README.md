# 🚂 Railway Maintenance System

A full-stack web application for managing railway cargo and equipment maintenance operations — built with React, Node.js, PostgreSQL, JWT auth, and Docker.

> This project was designed and built end-to-end: from a formal system design proposal (needs assessment, stakeholder analysis, user stories, sprint planning) through to a fully working implementation. The design document can be found in the `docs/` folder.

---

## 🚀 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Tailwind CSS + Vite    |
| Backend    | Node.js + Express                 |
| Database   | PostgreSQL 15                     |
| Auth       | JWT (Role-Based Access Control)   |
| Deployment | Docker Compose                    |

---

## 👥 User Roles

| Role           | Permissions                                                  |
|----------------|--------------------------------------------------------------|
| **Admin**      | Full access — users, audit log, all modules                  |
| **Supervisor** | Dashboard, tasks oversight, work orders, reports             |
| **Operator**   | Equipment, work orders, maintenance tasks, inventory         |
| **Technician** | Assigned tasks, work orders, incident reporting              |

---

## 🗂 Modules (12 Features)

| # | Module | Description |
|---|--------|-------------|
| 1 | **Authentication** | JWT login with role-based access control |
| 2 | **Dashboard** | KPI cards and equipment health bar chart |
| 3 | **Equipment Management** | Full CRUD — locomotives, freight cars, tracks, signals |
| 4 | **Maintenance Tasks** | Create, assign, prioritize, and track maintenance tasks |
| 5 | **Work Orders** | Corrective, preventive, inspection, and emergency work orders |
| 6 | **Inventory & Spare Parts** | Stock tracking with low-stock alerts and restock functionality |
| 7 | **Predictive Maintenance** | Health scores and overdue maintenance flags on equipment |
| 8 | **Incident Reporting** | Log, investigate, and resolve equipment incidents |
| 9 | **Reports & Analytics** | Equipment health charts, task trends, status overviews |
| 10 | **Notifications** | Role-targeted alerts for tasks, incidents, low stock |
| 11 | **Training Resources** | Document and guide library for maintenance crews |
| 12 | **Audit Log** | Full system action history (admin only) |

---

## ⚡ Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

```bash
# 1. Start all services
docker compose up --build

# 2. Seed demo data (new terminal, after containers are up)
docker exec rm_backend node seeds/seed.js

# 3. Open http://localhost:3001
```

> Note: This app runs on port **3001** to avoid conflicts with other local projects.

---

## 🔑 Demo Credentials

| Role        | Email                    | Password   |
|-------------|--------------------------|------------|
| Admin       | admin@railway.com        | Admin@123  |
| Supervisor  | supervisor@railway.com   | Super@123  |
| Operator    | operator@railway.com     | Oper@123   |
| Technician  | tech@railway.com         | Tech@123   |

---

## 📁 Project Structure

```
railway-maintenance/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # JWT auth + RBAC
│   │   └── routes/         # Express routers (11 modules)
│   ├── migrations/         # PostgreSQL schema (10 tables)
│   └── seeds/              # Demo data
├── frontend/
│   └── src/
│       ├── components/     # Layout, Modal
│       ├── context/        # Auth context
│       ├── pages/          # 12 page components
│       └── services/       # Axios API layer
├── docs/
│   └── System_Design_Document.docx
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

| Module        | Base Route              |
|---------------|-------------------------|
| Auth          | `/api/auth`             |
| Equipment     | `/api/equipment`        |
| Tasks         | `/api/tasks`            |
| Work Orders   | `/api/work-orders`      |
| Inventory     | `/api/inventory`        |
| Incidents     | `/api/incidents`        |
| Reports       | `/api/reports`          |
| Notifications | `/api/notifications`    |
| Training      | `/api/training`         |
| Users         | `/api/users`            |
| Audit Log     | `/api/audit`            |

---

## 📄 System Design Document

The `docs/System_Design_Document.docx` contains the full system design behind this application:

- **Needs Assessment** — why this system is needed
- **Problem Statement & Root Cause Analysis** — using the 5 Whys technique
- **Change Strategy** — organizational readiness, cost-benefit, timelines
- **Stakeholder Analysis** — power/interest grid with 10 stakeholder groups
- **Interview Guide** — structured + unstructured questions per stakeholder role
- **Essential Features** — 12 feature definitions that map directly to the built modules
- **User Stories** — 8 stories covering all major roles
- **Sprint Planning** — 12 sprints from authentication through post-deployment
- **Prototype Screens** — Sign Up, Login, Ticket Booking, Agent Login

---

## 🌐 Deployment (AWS)

This project is structured for easy cloud deployment:
- **ECS / EC2** — run the Docker Compose setup
- **RDS** — replace `DB_HOST` with your RDS PostgreSQL endpoint
- **S3** — host the frontend static build

---

## 📄 License

MIT
