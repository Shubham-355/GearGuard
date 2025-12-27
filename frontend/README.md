# GearGuard - The Ultimate Maintenance Tracker

GearGuard is a comprehensive equipment maintenance management system designed to streamline maintenance operations, track equipment health, manage work orders, and optimize maintenance team workflows.

## Features

- 🛠️ **Equipment Management** - Track equipment details, health status, and maintenance history
- 📋 **Maintenance Requests** - Create and manage corrective and preventive maintenance requests
- 👥 **Team Management** - Organize maintenance teams and assign technicians
- 📊 **Dashboard & Analytics** - Real-time insights into maintenance operations
- 📅 **Calendar View** - Schedule and visualize maintenance activities
- 🤖 **AI Chatbot** - Gemini-powered assistant for maintenance queries
- 🔔 **Notifications** - Stay updated on critical maintenance events
- 🏢 **Multi-Company Support** - Manage multiple companies with invite-based access
- 🔐 **Role-Based Access Control** - Admin, Maintenance Manager, Technician, and Employee roles

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GearGuard
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=5000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/gearguard?schema=public"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="GearGuard <your-email@gmail.com>"

# Gemini AI Configuration (Optional)
# Get your API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here
```

#### Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database with sample data
npm run db:seed
```

#### Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd ../frontend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend` directory (if needed):

```env
VITE_API_URL=http://localhost:5000/api
```

**Note:** The frontend uses `http://localhost:5000/api` as the default API URL configured in `src/config/constants.js`

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend application will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```
