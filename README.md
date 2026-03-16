# AI-native LIMS

A highly configurable Laboratory Information Management System (LIMS) powered by AI, enabling lab technicians to set up, manage, and optimize workflows using natural language and drag-and-drop interfaces.

## Purpose
Streamline lab operations, reduce manual effort, and provide intelligent assistance for data management, workflow tracking, and reporting.

## Features
- **Natural Language Workflow Creation**: Describe workflows in plain English, AI generates the structure
- **Drag-and-Drop UI Builder**: Visual workflow design with sortable steps
- **Real-time Progress Indicator**: Always-visible workflow status
- **Configurable Components**: Sample collection, analysis, review, notifications, and custom steps

## Tech Stack
- **Frontend**: React, TypeScript, Material UI, @dnd-kit
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-3.5/4
- **DevOps**: Docker, docker-compose

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key

### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/KeyurParaskar/ailims.git
cd ailims

# Copy environment file and add your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start all services
docker-compose up -d

# Access the app at http://localhost:3000
```

### Manual Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## Project Structure
```
ailims/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   └── services/   # API services
│   └── Dockerfile
├── backend/            # Node.js backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── db/         # Database migrations
│   └── Dockerfile
├── docs/               # Documentation
├── docker-compose.yml  # Container orchestration
└── README.md
```

## Default Test Users

The system comes with pre-configured test users for each role:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@ailims.com | admin123 | Admin | Full access, user management, all features |
| manager@ailims.com | manager123 | Lab Manager | Workflow management, view audit logs, team oversight |
| tech@ailims.com | tech123 | Lab Tech | Create/edit workflows, run samples, basic operations |

## Architecture & Implementation
See [docs/plan.md](docs/plan.md) for detailed architecture and implementation phases.
