<div align="center">
  <img src="https://via.placeholder.com/120x120/0f172a/06b6d4?text=SV" alt="SureVision AI Logo" width="120" height="120" />
  <h1>SureVision AI</h1>
  <p><strong>The Intelligence Engine for Enterprise Operating Decisions</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/Language-TypeScript-007ACC?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
</div>

<br />

## 🌟 Overview

**SureVision AI** is a premium, full-stack decision intelligence platform designed to replace biased spreadsheets with autonomous, LLM-driven opportunity modeling. It takes proposed enterprise changes (e.g., swapping procurement vendors, automating SLAs) and predicts hidden compliance risks, generates trust scores, formulates a phased rollout strategy, and calculates the quantitative **Cost of Inaction (COI)**.

Built expressly for high-stakes environments like banking, insurance, and logistics operations.

## ✨ Features

- **Decision Analysis Engine:** Powered by Google's Gemini LLM to dissect enterprise proposals and generate board-ready executive summaries.
- **Cost of Inaction Metrics:** Automatically computes the daily financial bleed of executive bottlenecks using risk exposure logic.
- **Premium Reporting:** One-click, physically signable PDF exports utilizing `pdfkit` and beautiful dark-mode HTML email briefs.
- **Enterprise Controls:** Fully integrated RBAC (Viewer, Analyst, Admin), audit logging, secure SMTP tokenized password resets, and user authentication.
- **World-Class UI:** Glassmorphism aesthetics driven by Tailwind CSS and orchestrated micro-animations using Framer Motion.

## 🏗️ Architecture

SureVision AI uses a decoupled Monorepo structure for scale:

- **`/frontend`**: A Next.js 15 App Router client. Manages state with Zustand, handles user presentation, dynamic charting, and onboarding logic.
- **`/backend`**: An Express.js Node API connected to MongoDB. Handles session authentication, JWT tokens, AI prompting, and report generation (PDF/CSV/Emails).
- **`/ai-engine`** *(Abstracted)*: Handles the determinism vs. predictive split when communicating with the core LLMs.

## 🚀 Quickstart

### Prerequisites
- Node.js (v20+)
- MongoDB connection string
- Google Gemini API Key
- SMTP credentials (e.g., Resend, SendGrid)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/surevision-ai.git
cd surevision-ai

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Environment Variables
Create `.env` inside the `/backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=super_secure_key
FRONTEND_URL=http://localhost:3000

# Email config (SMTP)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_user
SMTP_PASS=your_password
SMTP_FROM="SureVision AI <noreply@surevision.ai>"
```
Create `.env.local` inside the `/frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run the Platform
Seed the database with sample users and decisions:
```bash
cd backend
npm run seed
```

Start the platform in development mode:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The platform is now running at `http://localhost:3000`. 
*Default Admin:* `admin@surevision.ai` / *Password:* `Admin@123`

---
*Created for the final enterprise launch. See `PROJECT_DOCUMENTATION.txt` for extensive architecture and testing notes.*
"# surevision_ai" 
