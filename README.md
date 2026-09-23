# 💰 ExpenseAI

> AI-powered personal finance management platform for tracking expenses, managing budgets, and getting intelligent financial insights.

## 🚀 Overview

ExpenseAI is a full-stack personal finance platform that combines expense tracking, budgeting, analytics, and AI-powered financial assistance in one modern web application.

The platform helps users understand their spending patterns, organize expenses, manage budgets, and receive AI-generated insights about their financial activity.

## ✨ Features

- 🔐 Secure user authentication
- 💸 Add, edit, delete, and manage expenses
- 🏷️ Expense categorization
- 🤖 AI-powered expense categorization
- 🧠 AI-generated financial insights
- 💬 Ask ExpenseAI for financial questions
- 📊 Interactive spending analytics
- 💰 Budget creation and tracking
- 👤 User profile and preferences
- 📥 CSV ledger export
- 🌙 Premium dark glassmorphism interface
- 📱 Responsive web interface

## 🤖 AI Capabilities

ExpenseAI integrates Google's Gemini AI to provide intelligent financial assistance.

AI features include:

- Automatic expense categorization
- Spending pattern analysis
- Personalized financial insights
- Natural-language financial questions
- Context-aware recommendations based on expense data

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Recharts

### Backend
- Node.js
- Express
- TypeScript

### Database
- Prisma ORM
- SQLite (development)
- PostgreSQL-ready architecture for production

### AI
- Google Gemini API

### Authentication & Security
- JWT authentication
- bcrypt password hashing
- Environment-based secrets
- CORS configuration

## 🏗️ Architecture

```text
┌──────────────────────┐
│    React Frontend    │
│   TypeScript + Vite  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Express API       │
│      Node.js         │
└──────┬─────────┬─────┘
       │         │
       ▼         ▼
┌───────────┐  ┌──────────────┐
│  Prisma   │  │  Gemini AI   │
│  Database │  │     API      │
└───────────┘  └──────────────┘