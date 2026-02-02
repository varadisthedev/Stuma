# Stuma Frontend - Teacher Attendance Tracking System

A modern, clean React frontend for the Stuma attendance tracking system.

## Tech Stack

- **React 19** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Chart.js** - Beautiful charts and visualizations
- **Tailwind CSS** - Utility-first CSS framework

## Features

- **Dashboard** - Current class overview, today's schedule, quick stats
- **Classes Management** - Weekly timetable with day-based organization
- **Students Management** - Add and search students
- **Attendance Marking** - Intuitive toggle interface with bulk actions
- **Analytics** - Charts, categorization, and AI-powered insights

## Getting Started

### Prerequisites

- Node.js 18+
- Running backend server (default: http://localhost:5000)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# - VITE_API_URL: Backend API URL
# - VITE_GEMINI_API_KEY: For AI insights (optional)

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_GEMINI_API_KEY` | Gemini API key for AI insights | - |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Auth-related components
│   ├── layout/         # Layout components (Navbar, Layout)
│   └── ui/             # Generic UI components (Alert, Modal, etc.)
├── context/            # React Context providers
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Analytics/      # Analytics page with charts
│   ├── Attendance/     # Attendance marking page
│   ├── Classes/        # Timetable management
│   ├── Dashboard/      # Main dashboard
│   ├── Login/          # Login/Register page
│   └── Students/       # Student management
├── services/           # API service layer
│   └── api.js          # Axios instance & API functions
├── utils/              # Utility functions
│   └── helpers.js      # Date, format, validation helpers
├── App.jsx             # Main app with routing
├── main.jsx            # Entry point
└── index.css           # Global styles & design system
```

## Console Logging

The app includes comprehensive logging for debugging:

| Prefix | Area |
|--------|------|
| `[INIT]` | Application initialization |
| `[API]` | API requests/responses |
| `[AUTH]` | Authentication events |
| `[DASHBOARD]` | Dashboard operations |
| `[CLASSES]` | Class management |
| `[STUDENTS]` | Student management |
| `[ATTENDANCE]` | Attendance marking |
| `[ANALYTICS]` | Analytics & charts |
| `[AI]` | Gemini AI integration |

## Design System

### Color Palette

- **Background**: `#E8DBD6` (soft neutral)
- **Primary**: `#09416D` (deep blue)
- **Accent**: `#BBBBE3` (muted lavender)
- **Highlight**: `#AF79A0` (secondary accent)
- **Muted**: `#B4B8C5` (gray)

### Status Colors

- **Success/Perfect**: Green tones (`#22C55E`)
- **Warning/Above 75%**: Yellow/Orange (`#F59E0B`)
- **Danger/Critical**: Red (`#EF4444`)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Integration

All API calls go through the service layer in `src/services/api.js`:

- Automatic token handling via interceptors
- Consistent error handling
- 401 auto-redirect to login
- Request/response logging in development

## Contributing

1. Follow the existing code structure
2. Use the design tokens from `index.css`
3. Add proper console logging with appropriate prefixes
4. Keep components focused and reusable
