# STUMA (Teacher & Volunteer Attendance Tracking System)
## Architectural & Reverse Engineering Specification

**Document Version:** 1.0.0  
**Target Repository:** STUMA (`varadisthedev/Stuma`)  
**Generated Date:** July 24, 2026  
**Audience:** Software Architects, Lead Engineers, AI Reverse-Engineering Agents, System Integrators  

---

## 1. Project Overview

### 1.1 Project Purpose
**Stuma** (Teacher & Volunteer Attendance Tracking System) is a multi-tenant, dual-role full-stack web application designed for educational foundations (specifically Renovatio Foundation) to streamline teacher and volunteer workflows. Key functionality includes:
- **Class Scheduling & Weekly Timetables:** Organization of subject classes with day, time slot, volunteer assignment, and YouTube learning content links.
- **Student Roster Management:** Roster tracking indexed by section and roll number, parent/student contact details, and student-level attendance statistics.
- **Smart Attendance Tracking:** Daily attendance marking (Present/Absent) per class session with bulk-toggle capabilities and optional volunteer session notes.
- **Live Geotagged Webcam Class Photo Captures:** Real-time webcam photo capture by volunteers with client-side HTML5 canvas overlay (timestamp + GPS coordinates) uploaded directly to Cloudinary.
- **AI-Powered Attendance Insights:** Analytics generation integrating Google Gemini AI (via backend proxy with an in-memory 5-minute TTL cache) for overall classroom health, risk warnings, and recommendations.
- **Volunteer-Admin Communication:** Broadcast alert system (Admins to all users) and a messaging system (Volunteers to Admin Inbox).
- **User & Profile Management:** Profile picture customization with facial recognition cropping via Cloudinary, and contact detail updates.

### 1.2 High-Level Architecture
The system employs a decoupled, multi-tier client-server architecture:
1. **Frontend Tier (Client):** A single-page React 19 application built using Vite 7, styled with Vanilla CSS and Tailwind CSS v4, rendered client-side, and routed via React Router v7. State management is handled through React Context API (`AuthContext` and `ThemeContext`).
2. **Backend Tier (Server):** A Node.js runtime running an Express.js v5 web server. It provides a RESTful JSON API organized into a modular Controller-Route-Model architecture with express-validator middleware and custom authentication middleware.
3. **Database Tier (Persistence):** MongoDB (Cloud Atlas or Local) managed via the Mongoose 9 Object Data Modeling (ODM) library.
4. **Third-Party Services Tier:**
   - **Cloudinary API (v2):** Media storage for class capture photos and profile avatars with automated image transformations.
   - **Google Gemini AI API (`gemini-2.5-flash`):** Automated educational analytics synthesis based on aggregated student attendance metrics.

### 1.3 Tech Stack
| Tier | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | React | ^19.2.0 | Reactive UI Rendering & Component Lifecycle |
| **Frontend Build Tool** | Vite | ^7.2.4 | Dev Server & Production Bundler |
| **Frontend Routing** | React Router DOM | ^7.13.0 | Client-Side SPA Routing & Route Guards |
| **Frontend Styling** | Tailwind CSS / Vanilla CSS | ^4.1.18 | Utility Classes & Custom Glassmorphism CSS |
| **Frontend Charts** | Chart.js & react-chartjs-2 | ^4.5.1 / ^5.3.1 | Data Visualization (Doughnut & Bar Charts) |
| **HTTP Client** | Axios | ^1.13.3 (client) / ^1.13.4 (server) | REST API Communication |
| **Backend Runtime** | Node.js | v18+ | Server JavaScript Runtime Environment |
| **Backend Framework** | Express.js | ^5.2.1 | HTTP Web Server & Middleware Pipeline |
| **Database & ODM** | MongoDB & Mongoose | ^9.1.5 | Document Database & Schema Validation |
| **Authentication** | JSON Web Token (JWT) | ^9.0.3 | Stateless Bearer Token Authentication |
| **Password Security** | bcryptjs / bcrypt | ^3.0.3 / ^6.0.0 | One-way Password Hashing (Salt Factor 10) |
| **Input Validation** | express-validator | ^7.0.1 | Middleware Input Sanitization & Validation |
| **Cloud Storage** | Cloudinary SDK | ^2.9.0 | Image Upload, Transformation & Hosting |
| **File Upload Handling** | Multer | ^2.1.1 | Multipart/form-data Parser Middleware |
| **Environment Config** | dotenv | ^17.2.3 | Environment Variable Loader |
| **Dev Tooling** | Nodemon | ^3.1.11 | Hot-reloading Node Server Daemon |

### 1.4 Design Patterns Used
- **MVC (Model-View-Controller):** Structured backend separation where Mongoose schemas define Data Models, Express controllers contain Business Logic, and JSON HTTP responses serve as Views.
- **Provider Pattern (React Context):** `AuthProvider` and `ThemeProvider` wrap the application tree to supply global state without prop drilling.
- **Guard / Protected Route Pattern:** `ProtectedRoute` and `AdminRoute` wrap React Router components to restrict unauthenticated or non-admin access.
- **Service Layer / API Adapter Pattern:** Centralized `api.js` encapsulates all Axios requests, request/response interceptors, and Bearer token insertion.
- **Middleware Chain Pattern:** Express routes execute sequentially through CORS, Body Parsers, JWT Auth Guard (`protect`), Input Validators, and Route Controllers, terminating in Global Error Handlers.
- **In-Memory Caching (TTL Cache):** `AttendanceController` uses a JavaScript `Map` with a 5-minute time-to-live to prevent excessive Gemini API calls.
- **Component Composition & Portals:** React Modals utilize `ReactDOM.createPortal` to mount modal overlays directly to `document.body`.

### 1.5 Folder Structure Summary
The workspace is split into two primary roots: `/client` (Frontend application) and `/server` (Backend application).
```text
STUMA/
├── README.md                     # Root project overview and local setup documentation
├── images/                       # Architectural export diagrams and documentation screenshots
├── client/                       # React 19 Frontend App (Vite)
│   ├── index.html                # HTML5 entry document
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── vite.config.js            # Vite configuration & security header policies
│   ├── vercel.json               # SPA route rewrite configuration for Vercel deployment
│   ├── .env.example / .env.local # Environment variable templates
│   └── src/                      # Frontend source code
│       ├── main.jsx              # Application bootstrapper
│       ├── App.jsx               # Router & Top-Level Context Provider Setup
│       ├── index.css             # Design tokens, keyframes, custom utility styles
│       ├── assets/               # Brand logos and static images
│       ├── components/           # UI, Layout, Chat, Capture & Auth Guard components
│       ├── context/              # Auth & Theme React Context definitions
│       ├── pages/                # Page route components (Analytics, Attendance, etc.)
│       ├── services/             # Axios API client setup and API module functions
│       └── utils/                # Date/time formatters & Indian holiday utilities
└── server/                       # Express.js Backend App (Node.js)
    ├── server.js                 # Database connector and HTTP listener startup
    ├── app.js                    # Express app initialization, middleware, routes
    ├── package.json              # Server dependencies and npm scripts
    ├── .env.example / .env       # Server environment variable secrets
    ├── config/                   # Third-party service configurations (Cloudinary)
    ├── controllers/              # Route handling controllers (7 files)
    ├── middleware/               # Auth protection & global error middleware (2 files)
    ├── models/                   # Mongoose database models (7 files)
    ├── routes/                   # Express route definitions (7 files)
    ├── services/                 # External service integrations (directory reserved)
    └── validators/               # Input validation rules using express-validator (4 files)
```

---

## 2. Directory Tree

Below is the repository directory tree with detailed explanations of folder responsibilities:

```text
STUMA/
├── client/
│   ├── public/                   # Static public web assets (favicon, manifest)
│   └── src/                      # Frontend React application codebase
│       ├── assets/               # Static image assets and brand logo PNGs
│       │   └── brandings/        # Logo variants (e.g., renovatioLogo.png)
│       ├── components/           # Reusable UI component modules
│       │   ├── auth/             # Authentication & authorization route wrapper components
│       │   ├── capture/          # Webcam capture widgets with geolocation & canvas overlays
│       │   ├── chat/             # Floating volunteer chat widget & admin inbox components
│       │   ├── layout/           # Global Page Background, Responsive Sidebar, Footer, Layout wrapper
│       │   └── ui/               # Reusable UI atoms (Alerts, Modals, Skeletons, StatCards, EmptyStates)
│       ├── context/              # React Context Providers for global state (AuthContext, ThemeContext)
│       ├── pages/                # Top-level page views rendered by React Router
│       │   ├── Analytics/        # Admin program-wide analytics & Volunteer performance metrics
│       │   ├── Attendance/       # Attendance marking page with bulk actions and session notes
│       │   ├── Classes/          # Weekly timetable grid management & Volunteer schedule view
│       │   ├── Dashboard/        # Role-based main landing dashboards (Admin & Volunteer)
│       │   ├── Gallery/          # Geotagged class photos photo-wall gallery with lightbox & maps link
│       │   ├── Login/            # Split-screen role-selected authentication page
│       │   ├── Profile/          # Profile view, webcam/file avatar uploader, contact updates
│       │   ├── Students/         # Student roster, section filters, search, attendance statistics
│       │   └── Volunteers/       # Volunteer management, profile detail view, admin chat inbox
│       ├── services/             # Axios API singleton and modular API call definitions (`api.js`)
│       └── utils/                # Shared helper functions, date/time formatters, Indian public holidays list
└── server/                       # Node.js Express backend codebase
    ├── config/                   # Third-party integrations (Cloudinary v2 configuration)
    ├── controllers/              # Express request handlers containing business logic
    ├── middleware/               # Custom Express middleware (JWT auth guard, 404, global error handler)
    ├── models/                   # Mongoose ODM schemas defining MongoDB collections
    ├── routes/                   # Express route handlers binding HTTP methods/paths to controllers
    ├── services/                 # Integration service layer (directory prepared for future extensions)
    └── validators/               # Request validation middleware built on express-validator
```

---

## 3. Entry Points

### 3.1 Identification of System Entry Points
1. **Frontend Application Entry:** `client/src/main.jsx`
   - Initializes React 19 `createRoot` bound to DOM node `#root`.
   - Wraps the top-level `<App />` component inside React `<StrictMode>`.
   - Logs environment runtime mode (`import.meta.env.MODE`) and target API URL.
2. **Frontend Routing Initialization:** `client/src/App.jsx`
   - Wraps the app with `<ThemeProvider>`, `<AuthProvider>`, and `<BrowserRouter>`.
   - Defines route hierarchy, binding `/login`, `/dashboard`, `/classes`, `/students`, `/volunteers`, `/my-schedule`, `/attendance`, `/analytics`, `/gallery`, `/profile`.
   - Configures `ProtectedRoute` and `AdminRoute` guards.
3. **Backend Application Initialization:** `server/app.js`
   - Creates the Express application instance (`const app = express()`).
   - Registers CORS middleware with whitelisted client origins.
   - Configures body parsers (`express.json({ limit: '15mb' })` and `express.urlencoded`).
   - Loads Cloudinary configuration (`require('./config/cloudinary')`).
   - Mounts 7 REST API routers under `/api/*` and a `/health` endpoint.
   - Registers 404 (`notFound`) and global error handling (`errorHandler`) middleware.
4. **Backend Server Startup:** `server/server.js`
   - Loads environment variables (`dotenv.config()`).
   - Verifies existence of `process.env.MONGO_URI`.
   - Connects to MongoDB Atlas via `mongoose.connect()`.
   - Starts HTTP server on `process.env.PORT` (default `5000`) listening on `0.0.0.0`.

### 3.2 Startup Sequence (Step-by-Step)
```text
[Backend Startup Sequence]
1. `node server.js` executed.
2. `dotenv.config()` loads `.env` file into `process.env`.
3. Check `process.env.MONGO_URI`. If missing, log error and `process.exit(1)`.
4. Import `./app.js`:
   a. Instantiate `express()`.
   b. Execute `require('./config/cloudinary')` -> Call `cloudinary.config()`.
   c. Mount `cors()` middleware with origin whitelist.
   d. Mount `express.json({ limit: '15mb' })` parser.
   e. Mount API routes (`/api/auth`, `/api/classes`, `/api/students`, `/api/attendance`, `/api/messages`, `/api/photos`, `/api/alerts`).
   f. Mount `/health` check GET endpoint.
   g. Attach `notFound` (404) and `errorHandler` middleware.
5. Execute `mongoose.connect(process.env.MONGO_URI)`.
6. Upon DB connection success, invoke `app.listen(PORT, "0.0.0.0")`.

[Frontend Startup Sequence]
1. User accesses application URL in browser.
2. Vite serves `client/index.html`, loading `client/src/main.jsx`.
3. `main.jsx` creates React root and renders `<App />`.
4. `<App />` mounts `<ThemeProvider>` -> Reads `localStorage['stuma-dark-mode']` -> Sets `data-theme` attribute on `document.documentElement`.
5. `<App />` mounts `<AuthProvider>` -> Checks `localStorage['token']` and `localStorage['user']` -> Restores user state.
6. `<BrowserRouter>` evaluates current window URL:
   - If `/` -> Render `<RootRedirect>` -> If authenticated, redirect to `/dashboard`, else `/login`.
   - If protected route -> `<ProtectedRoute>` evaluates `isAuthenticated` -> Renders `<Layout>` and `<Outlet />`.
```

---

## 4. Component Inventory

| Component Name | Responsibility | File Path | Dependencies | Used By | Communicates With |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `App` | Root component defining Context Providers and Routing | [App.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/App.jsx) | `react-router-dom`, `AuthContext`, `ThemeContext`, Layout & Page components | `main.jsx` | React Router DOM |
| `RootRedirect` | Redirects root route `/` based on authentication state | [App.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/App.jsx#L37-L43) | `useAuth`, `react-router-dom` | `App` | Auth Context |
| `AdminRoute` | Restricts non-admin users (volunteers) from accessing admin routes | [App.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/App.jsx#L48-L57) | `useAuth`, `react-router-dom` | `App` | Auth Context |
| `ProtectedRoute` | Redirects unauthenticated users to `/login` | [ProtectedRoute.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/auth/ProtectedRoute.jsx) | `useAuth`, `react-router-dom`, `Skeleton` | `App` | Auth Context |
| `Layout` | Main shell containing PageBackground, Sidebar, Footer, and Floating Widgets | [Layout.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/layout/Layout.jsx) | `useAuth`, `react-router-dom`, `Sidebar`, `VolunteerChatWidget`, `VolunteerCaptureWidget` | `App` | Auth Context, React Router |
| `Sidebar` | Collapsible desktop sidebar & mobile drawer with nav links & notifications | [Sidebar.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/layout/Sidebar.jsx) | `react-router-dom`, `useAuth`, `api.js`, `AlertsDropdown` | `Layout` | Auth Context, Alert API |
| `AlertsDropdown` | Notification dropdown displaying active alerts and global alert broadcast input | [Sidebar.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/layout/Sidebar.jsx#L25-L139) | `api.js`, `react` | `Sidebar` | Alert API (`/api/alerts`) |
| `VolunteerCaptureWidget` | Floating webcam photo capture widget with GPS geotagging & canvas text baking | [VolunteerCaptureWidget.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/capture/VolunteerCaptureWidget.jsx) | `useAuth`, `photosAPI`, `classesAPI`, `helpers` | `Layout` | Photos API, Classes API, Browser Geolocation & MediaDevices |
| `VolunteerChatWidget` | Floating messaging widget for volunteers to send text to admin inbox | [ChatComponents.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/chat/ChatComponents.jsx#L6-L108) | `messagesAPI`, `react` | `Layout` | Messages API (`/api/messages`) |
| `AdminMessageInbox` | Admin inbox panel displaying volunteer messages with read status toggles | [ChatComponents.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/chat/ChatComponents.jsx#L111-L181) | `messagesAPI`, `react` | `VolunteersPage` | Messages API (`/api/messages`) |
| `Alert` | Styled status message banner (info, success, warning, error) | [Alert.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/ui/Alert.jsx) | `react` | Pages & Modals | None |
| `EmptyState` | Placeholder component when data arrays are empty | [EmptyState.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/ui/EmptyState.jsx) | `react` | Pages | None |
| `Modal` | Portal-based accessible modal container with backdrop dismissal and escape key handler | [Modal.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/ui/Modal.jsx) | `react-dom` (`createPortal`) | Pages | DOM Root |
| `Skeleton` | Animated pulsing UI placeholder skeletons (`DashboardSkeleton`, `GridPageSkeleton`, etc.) | [Skeleton.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/ui/Skeleton.jsx) | `react` | Pages & ProtectedRoute | None |
| `StatCard` | Glassmorphism metric display card | [StatCard.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/components/ui/StatCard.jsx) | `react` | Dashboard Pages | None |
| `LoginPage` | Split-screen authentication view supporting Admin/Volunteer role selection | [LoginPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Login/LoginPage.jsx) | `useAuth`, `react-router-dom`, `Alert` | `App` | Auth Context |
| `DashboardPage` | Top-level dashboard router switching between Admin & Volunteer views | [DashboardPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Dashboard/DashboardPage.jsx) | `useAuth`, `classesAPI`, `studentsAPI`, `authAPI`, `VolunteerDashboard` | `App` | Auth, Classes, Students, Volunteers APIs |
| `VolunteerDashboard` | Dashboard view for volunteers showing stats and upcoming/assigned classes | [VolunteerDashboard.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Dashboard/VolunteerDashboard.jsx) | `useAuth`, `classesAPI`, `studentsAPI`, `helpers` | `DashboardPage` | Classes API, Students API |
| `ClassesPage` | Admin timetable management view with week offset navigation & class creation modal | [ClassesPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Classes/ClassesPage.jsx) | `classesAPI`, `authAPI`, `timetableUtils`, `Modal`, `Alert` | `App` | Classes API, Volunteers API |
| `VolunteerSchedulePage` | Read-only weekly schedule grid for volunteers | [VolunteerSchedulePage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Classes/VolunteerSchedulePage.jsx) | `classesAPI`, `useAuth`, `timetableUtils` | `App` | Classes API |
| `StudentsPage` | Student roster management, roll number validation, search, and student detail statistics | [StudentsPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Students/StudentsPage.jsx) | `studentsAPI`, `useAuth`, `Modal`, `Alert` | `App` | Students API |
| `StudentDetail` | Side panel rendering student attendance history, contact info, and notes | [StudentsPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Students/StudentsPage.jsx#L29-L129) | `studentsAPI` | `StudentsPage` | Students API (`/stats`) |
| `AttendancePage` | Interactive attendance marking panel with bulk actions and notes | [AttendancePage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Attendance/AttendancePage.jsx) | `classesAPI`, `studentsAPI`, `attendanceAPI`, `useAuth`, `react-router-dom` | `App` | Classes, Students, Attendance APIs |
| `AnalyticsPage` | Main analytics page delegating to Admin or Volunteer analytics | [AnalyticsPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Analytics/AnalyticsPage.jsx) | `useAuth`, `attendanceAPI`, `AdminAnalytics`, `VolunteerAnalytics` | `App` | Attendance API |
| `AdminAnalytics` | Program-level analytics view with Doughnut/Bar charts and Gemini AI prompt generator | [AnalyticsPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Analytics/AnalyticsPage.jsx#L31-L242) | `react-chartjs-2`, `attendanceAPI` | `AnalyticsPage` | Attendance API (`/overall-ai`) |
| `VolunteerAnalytics` | Personal performance metrics view for volunteers with doughnut/bar charts | [AnalyticsPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Analytics/AnalyticsPage.jsx#L245-L554) | `react-chartjs-2`, `classesAPI` | `AnalyticsPage` | Classes API |
| `VolunteersPage` | Admin management panel for creating, editing, deleting volunteers, viewing stats & messages | [VolunteersPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Volunteers/VolunteersPage.jsx) | `authAPI`, `classesAPI`, `Modal`, `Alert`, `AdminMessageInbox` | `App` | Auth API, Classes API |
| `GalleryPage` | Photo wall displaying geotagged class webcam photos with modal lightbox and Google Maps link | [GalleryPage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Gallery/GalleryPage.jsx) | `photosAPI`, `useAuth`, `react-dom` | `App` | Photos API |
| `ProfilePage` | User profile page supporting webcam/file avatar uploads, profile editing, and logout | [ProfilePage.jsx](file:///c:/Users/varad/Desktop/projects/STUMA/client/src/pages/Profile/ProfilePage.jsx) | `photosAPI`, `useAuth`, `react-router-dom` | `App` | Photos API, Auth Context |

---

## 5. API Documentation

### 5.1 Authentication Endpoints

#### 1. Register Admin User
- **Method:** `POST`
- **Route:** `/api/auth/register`
- **Controller:** `auth.controller.js -> register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  { "name": "John Doe", "email": "admin@renovatio.org", "password": "password123" }
  ```
- **Validation:** `registerValidation` (`name` min 2 chars; `email` valid email; `password` min 6 chars).
- **Authentication:** Public.
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "user": { "id": "60d5ec49f1b2c81184a7e100", "name": "John Doe", "email": "admin@renovatio.org", "role": "admin", "profilePicUrl": "", "phone": "" },
    "teacher": { "id": "60d5ec49f1b2c81184a7e100", "name": "John Doe", "email": "admin@renovatio.org", "role": "admin", "profilePicUrl": "" }
  }
  ```
- **Error Responses:** `400 Bad Request` ("Email already registered" / Validation failed); `500 Internal Server Error`.
- **Database Interaction:** `User.findOne({ email })`, `User.create()`.

#### 2. User Login
- **Method:** `POST`
- **Route:** `/api/auth/login`
- **Controller:** `auth.controller.js -> login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  { "email": "admin@renovatio.org", "password": "password123", "role": "admin" }
  ```
- **Validation:** `loginValidation` (`email` required & valid; `password` required).
- **Authentication:** Public.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "teacher": { "id": "60d5ec49f1b2c81184a7e100", "name": "John Doe", "email": "admin@renovatio.org", "role": "admin", "profilePicUrl": "", "phone": "" },
    "user": { "id": "60d5ec49f1b2c81184a7e100", "name": "John Doe", "email": "admin@renovatio.org", "role": "admin", "profilePicUrl": "", "phone": "" }
  }
  ```
- **Error Responses:** `401 Unauthorized` ("Invalid credentials"); `403 Forbidden` ("Account is not registered as a volunteer"); `500 Internal Server Error`.
- **Database Interaction:** `User.findOne({ email })`.

#### 3. Fetch Volunteers List
- **Method:** `GET`
- **Route:** `/api/auth/volunteers`
- **Controller:** `auth.controller.js -> getVolunteers`
- **Headers:** `Authorization: Bearer <token>`
- **Authentication:** Protected (`auth.middleware.js`).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "volunteers": [
      { "_id": "60d5ec49f1b2c81184a7e101", "name": "Alice Smith", "email": "alice@renovatio.org", "profilePicUrl": "", "phone": "+91 9876543210", "createdAt": "2026-01-10T10:00:00.000Z" }
    ]
  }
  ```
- **Database Interaction:** `User.find({ role: 'volunteer' }).select('name email profilePicUrl phone createdAt')`.

#### 4. Create Volunteer Account
- **Method:** `POST`
- **Route:** `/api/auth/volunteers`
- **Controller:** `auth.controller.js -> createVolunteer`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:** `{ "name": "Alice Smith", "email": "alice@renovatio.org", "password": "password123" }`
- **Authentication:** Protected.
- **Success Response (201 Created):**
  ```json
  { "success": true, "volunteer": { "id": "60d5ec49f1b2c81184a7e101", "name": "Alice Smith", "email": "alice@renovatio.org", "role": "volunteer" } }
  ```
- **Database Interaction:** `User.findOne({ email })`, `User.create({ role: 'volunteer' })`.

#### 5. Update Volunteer Profile
- **Method:** `PUT`
- **Route:** `/api/auth/volunteers/:id`
- **Controller:** `auth.controller.js -> updateVolunteer`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:** `{ "name": "Alice Smith Updated", "email": "alice.new@renovatio.org", "phone": "+91 9999999999", "password": "optionalNewPassword" }`
- **Authentication:** Protected.
- **Success Response (200 OK):**
  ```json
  { "success": true, "volunteer": { "_id": "60d5ec49f1b2c81184a7e101", "name": "Alice Smith Updated", "email": "alice.new@renovatio.org", "profilePicUrl": "", "phone": "+91 9999999999" } }
  ```
- **Database Interaction:** `User.findOne({ _id: id, role: 'volunteer' })`, `user.save()`.

#### 6. Delete Volunteer Account
- **Method:** `DELETE`
- **Route:** `/api/auth/volunteers/:id`
- **Controller:** `auth.controller.js -> deleteVolunteer`
- **Headers:** `Authorization: Bearer <token>`
- **Authentication:** Protected.
- **Success Response (200 OK):** `{ "success": true, "message": "Volunteer deleted successfully" }`
- **Database Interaction:** `User.findOneAndDelete({ _id: id, role: 'volunteer' })`.

---

### 5.2 Class Management Endpoints

#### 7. Create Scheduled Class
- **Method:** `POST`
- **Route:** `/api/classes`
- **Controller:** `class.controller.js -> createClass`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "subject": "Mathematics",
    "date": "2026-07-25",
    "day": "Saturday",
    "startTime": "09:00",
    "endTime": "10:00",
    "assignedVolunteer": "60d5ec49f1b2c81184a7e101",
    "youtubeLink": "https://youtube.com/watch?v=12345"
  }
  ```
- **Validation:** `createClassValidation` (`subject` min 2 chars; `day` valid weekday string; `startTime` & `endTime` matching `HH:MM`; `endTime` > `startTime`).
- **Business Rule:** Overlapping check verifies if the assigned volunteer is busy on the given date during `startTime` to `endTime`.
- **Success Response (201 Created):**
  ```json
  { "success": true, "message": "Class created successfully", "class": { "_id": "60d5ec49f1b2c81184a7e102", "subject": "Mathematics", ... } }
  ```
- **Database Interaction:** `Class.findOne(overlappingQuery)`, `Class.create()`.

#### 8. Get All Classes
- **Method:** `GET`
- **Route:** `/api/classes`
- **Controller:** `class.controller.js -> getAllClasses`
- **Headers:** `Authorization: Bearer <token>`
- **Authentication:** Protected (If user is Admin -> return classes created by admin; If Volunteer -> return classes assigned to volunteer).
- **Success Response (200 OK):**
  ```json
  { "success": true, "classes": [ { "_id": "...", "subject": "Mathematics", "assignedVolunteer": { "_id": "...", "name": "Alice Smith", "email": "alice@renovatio.org" } } ] }
  ```
- **Database Interaction:** `Class.find(query).populate('assignedVolunteer', 'name email').sort({ day: 1, startTime: 1 })`.

#### 9. Get Today's Classes
- **Method:** `GET`
- **Route:** `/api/classes/today`
- **Controller:** `class.controller.js -> getTodayClasses`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200 OK):** `{ "success": true, "day": "Saturday", "classes": [ ... ] }`
- **Database Interaction:** `Class.find({ day: today, ...roleQuery }).sort({ startTime: 1 })`.

#### 10. Get Current Running Class
- **Method:** `GET`
- **Route:** `/api/classes/current`
- **Controller:** `class.controller.js -> getCurrentClass`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200 OK):** `{ "success": true, "currentTime": "09:30", "day": "Saturday", "currentClass": { ... } }`

---

### 5.3 Student Roster Endpoints

#### 11. Add Student
- **Method:** `POST`
- **Route:** `/api/students`
- **Controller:** `student.controller.js -> addStudent`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:** `{ "name": "Rahul Kumar", "rollNo": "101", "section": "GRADE 8A", "phone": "9876543210", "parentPhone": "9876543211", "notes": "Excels in algebra" }`
- **Validation:** `addStudentValidation` (`name` min 2; `rollNo` min 1). Section normalized to uppercase trim.
- **Success Response (201 Created):** `{ "success": true, "message": "Student added successfully", "student": { ... } }`
- **Database Interaction:** `Student.findOne({ admin: req.userId, section, rollNo })`, `Student.create()`.

#### 12. Get All Students
- **Method:** `GET`
- **Route:** `/api/students`
- **Controller:** `student.controller.js -> getAllStudents`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200 OK):** `{ "success": true, "count": 1, "students": [ ... ] }`
- **Database Interaction:** `Student.find(query).sort({ section: 1, rollNo: 1 })`.

#### 13. Get Individual Student Attendance Statistics
- **Method:** `GET`
- **Route:** `/api/students/:studentId/stats`
- **Controller:** `student.controller.js -> getStudentStats`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "totalClasses": 10,
    "attended": 8,
    "absent": 2,
    "records": [
      { "date": "2026-07-20T00:00:00.000Z", "subject": "Mathematics", "classId": "...", "status": "present", "note": "Great participation", "takenBy": "Alice Smith" }
    ]
  }
  ```
- **Database Interaction:** `Attendance.find({ 'records.student': studentId }).populate('class').populate('takenBy')`.

---

### 5.4 Attendance Endpoints

#### 14. Mark Attendance
- **Method:** `POST`
- **Route:** `/api/attendance`
- **Controller:** `attendance.controller.js -> markAttendance`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "class": "60d5ec49f1b2c81184a7e102",
    "date": "2026-07-25",
    "note": "Smooth session, all quiet",
    "records": [
      { "student": "60d5ec49f1b2c81184a7e200", "status": "present" },
      { "student": "60d5ec49f1b2c81184a7e201", "status": "absent" }
    ]
  }
  ```
- **Validation:** `markAttendanceValidation` (`class` MongoId; `date` ISO8601; `records` array min 1 with status `present`/`absent`).
- **Ownership Verification:** Verifies user is either the class admin or the assigned volunteer.
- **Success Response (201 Created):** `{ "success": true, "message": "Attendance marked successfully", "attendance": { ... } }`
- **Database Interaction:** `Attendance.findOne({ class, date })`, `Attendance.create()`.

#### 15. Get Attendance Records by Class
- **Method:** `GET`
- **Route:** `/api/attendance/class/:classId`
- **Controller:** `attendance.controller.js -> getAttendanceByClass`

#### 16. Get Attendance Analytics for Class
- **Method:** `GET`
- **Route:** `/api/attendance/analytics/:classId`
- **Controller:** `attendance.controller.js -> attendanceAnalytics`
- **Returns:** Attendance percentage per student and categorizes into `perfect` (100%), `above75` (75-99%), and `critical` (<75%).

#### 17. Get Attendance Chart Data
- **Method:** `GET`
- **Route:** `/api/attendance/chart/:attendanceId`
- **Controller:** `attendance.controller.js -> attendanceChartData`
- **Returns:** `{ "labels": ["Present", "Absent"], "datasets": [ { "data": [18, 2], "backgroundColor": ["#4CAF50", "#F44336"] } ] }`

#### 18. Get Class AI Insights
- **Method:** `GET`
- **Route:** `/api/attendance/ai-insights/:classId`
- **Controller:** `attendance.controller.js -> getAIInsightsPrompt`
- **Behavior:** Checks `aiInsightsCache` (5-min TTL). If stale/miss, aggregates class metrics, constructs detailed text prompt, calls Google Gemini API `gemini-2.5-flash:generateContent`, caches and returns AI response.

#### 19. Get Program Overall Analytics
- **Method:** `GET`
- **Route:** `/api/attendance/overall`
- **Controller:** `attendance.controller.js -> getOverallAnalytics`
- **Returns:** `totalClasses`, `totalSessions`, `overallRate`, `volunteerDistribution`, and 8-week `weeklyData`.

#### 20. Get Overall Program AI Insights
- **Method:** `GET`
- **Route:** `/api/attendance/overall-ai`
- **Controller:** `attendance.controller.js -> getOverallAIInsights`
- **Behavior:** Aggregates macro-level foundation statistics and queries Gemini API for executive summaries.

---

### 5.5 Photos & Profile Endpoints

#### 21. Upload Live Class Capture Photo
- **Method:** `POST`
- **Route:** `/api/photos/capture`
- **Controller:** `photo.controller.js -> uploadClassPhoto`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "classId": "60d5ec49f1b2c81184a7e102",
    "location": { "lat": 18.5204, "lng": 73.8567, "accuracy": 15 },
    "takenAt": "2026-07-25T09:15:00.000Z",
    "metadata": { "classDate": "2026-07-25", "classTime": "09:00-10:00", "subject": "Mathematics" }
  }
  ```
- **Success Response (201 Created):** Uploads to Cloudinary folder `stuma/class-captures` with max width 1280px, creates `ClassPhoto` record, and returns populated object.

#### 22. Get Photo Gallery
- **Method:** `GET`
- **Route:** `/api/photos/gallery`
- **Controller:** `photo.controller.js -> getGallery`
- **Behavior:** Admin receives all photos across the organization; Volunteers receive only their own uploads.

#### 23. Delete Photo
- **Method:** `DELETE`
- **Route:** `/api/photos/:photoId`
- **Controller:** `photo.controller.js -> deletePhoto`
- **Authorization:** Admin only (`role === 'admin'`). Destroys public ID on Cloudinary and deletes MongoDB document.

#### 24. Upload Profile Picture
- **Method:** `POST`
- **Route:** `/api/photos/profile-pic`
- **Controller:** `photo.controller.js -> uploadProfilePic`
- **Behavior:** Uploads to Cloudinary folder `stuma/profile-pics` with 400x400 face-cropping, removes previous image from Cloudinary, and updates `User.profilePicUrl`.

#### 25. Update User Profile Info
- **Method:** `PATCH`
- **Route:** `/api/photos/profile`
- **Controller:** `photo.controller.js -> updateProfile`
- **Request Body:** `{ "name": "Jane Doe", "phone": "+91 9876543210" }`

#### 26. Get User Profile
- **Method:** `GET`
- **Route:** `/api/photos/profile`
- **Controller:** `photo.controller.js -> getProfile`

---

### 5.6 Alerts & Messaging Endpoints

#### 27. Broadcast Admin Alert
- **Method:** `POST`
- **Route:** `/api/alerts`
- **Controller:** `alert.controller.js -> createAlert`
- **Authorization:** Admin only (`role === 'admin'`). Creates global notification record.

#### 28. Get Active Notifications
- **Method:** `GET`
- **Route:** `/api/alerts`
- **Controller:** `alert.controller.js -> getAlerts`
- **Returns:** Latest 50 broadcast alerts.

#### 29. Send Message to Admin
- **Method:** `POST`
- **Route:** `/api/messages`
- **Controller:** `message.controller.js -> sendMessage`
- **Request Body:** `{ "text": "Can I swap the Saturday 10AM slot?" }`

#### 30. Get Volunteer Messages Inbox
- **Method:** `GET`
- **Route:** `/api/messages`
- **Controller:** `message.controller.js -> getMessages`
- **Authorization:** Admin only (`role === 'admin'`). Returns all volunteer messages sorted by date.

#### 31. Mark Message as Read
- **Method:** `PATCH`
- **Route:** `/api/messages/:id/read`
- **Controller:** `message.controller.js -> markRead`

---

## 6. Authentication & Authorization Flow

### 6.1 Authentication Architecture
Stateless Bearer Token-based authentication using **JSON Web Tokens (JWT)** and **bcryptjs**.

```text
+-------------------+             +-----------------------+             +--------------------+
|  React Client     |             |  Express Router       |             |  MongoDB / User    |
+---------+---------+             +-----------+-----------+             +---------+----------+
          |                                   |                                   |
          |  1. POST /api/auth/login          |                                   |
          +---------------------------------->|                                   |
          |     { email, password, role }     |                                   |
          |                                   |  2. User.findOne({ email })        |
          |                                   +---------------------------------->|
          |                                   |<----------------------------------+
          |                                   |     Returns User Record           |
          |                                   |                                   |
          |                                   |  3. bcrypt.compare(pass, hash)    |
          |                                   |  4. jwt.sign({ id }, JWT_SECRET)  |
          |  5. 200 OK { token, user }         |                                   |
          |<----------------------------------+                                   |
          |                                   |                                   |
          |  6. Store Token in localStorage   |                                   |
          |  7. Attach `Authorization: Bearer` |                                  |
          |     on subsequent API requests    |                                   |
```

### 6.2 Token Lifecycle & Verification
- **Token Generation:** Generated in `auth.controller.js` using `jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })`.
- **Token Transmission:** Client stores `token` in `localStorage` and `api.js` request interceptor injects:
  `config.headers.Authorization = 'Bearer ' + token`.
- **Middleware Guard (`auth.middleware.js`):**
  1. Extracts token from `req.headers.authorization.split(" ")[1]`.
  2. If missing -> HTTP `401 Unauthorized` (`{ message: "No token provided" }`).
  3. Verifies token via `jwt.verify(token, process.env.JWT_SECRET)`.
  4. Fetches user details: `req.user = await User.findById(decoded.id).select("-password")`.
  5. Sets `req.userId = decoded.id`.
  6. Calls `next()`.

### 6.3 Role-Based Access Control (RBAC)
User roles are constrained by the enum `["admin", "volunteer"]` on the `User` schema:
- **Admin Privileges:**
  - Create and manage scheduled classes.
  - Add, edit, and delete student records.
  - Create, update, and delete volunteer accounts.
  - Access global analytics and trigger program-level AI summaries.
  - Delete photos from gallery and Cloudinary.
  - Post global broadcast alerts.
  - View and mark volunteer inbox messages as read.
- **Volunteer Privileges:**
  - View personal assigned timetable (`/my-schedule`).
  - Take attendance for assigned classes.
  - Open webcam widget during active class window to capture geotagged photos.
  - View personal performance analytics.
  - Send private messages to the admin inbox.
  - Update personal profile (avatar, name, phone).

---

## 7. Database Design

The system relies on 7 Mongoose collections in MongoDB:

```text
+-------------------+           +-------------------+           +-------------------+
|       User        |           |       Class       |           |      Student      |
+-------------------+           +-------------------+           +-------------------+
| _id (ObjectId)    |<----------| admin (ObjectId)  |     +---->| admin (ObjectId)  |
| role (String)     |           | assignedVol       |-----+     | name (String)     |
| name (String)     |           |   (ObjectId)      |           | rollNo (String)   |
| email (String)    |           | subject (String)  |           | section (String)  |
| password (String) |           | date (String)     |           | phone (String)    |
| profilePicUrl     |           | day (String)      |           | parentPhone       |
| profilePicPublicId|           | startTime (String)|           | notes (String)    |
| phone (String)    |           | endTime (String)  |           +-------------------+
| timestamps        |           | youtubeLink       |                     ^
+-------------------+           | timestamps        |                     |
   ^      ^      ^              +-------------------+                     |
   |      |      |                        ^                               |
   |      |      |                        |                               |
   |      |      +-----------------+      |                               |
   |      |                        |      |                               |
+--+------+---------+           +--+------+---------+                     |
|    ClassPhoto     |           |    Attendance     |                     |
+-------------------+           +-------------------+                     |
| _id (ObjectId)    |           | _id (ObjectId)    |                     |
| volunteer (Ref)   |           | class (Ref Class) |                     |
| class (Ref Class) |           | admin (Ref User)  |                     |
| imageUrl (String) |           | takenBy (Ref User)|                     |
| publicId (String) |           | date (Date)       |                     |
| location (Object) |           | note (String)     |                     |
| takenAt (Date)    |           | records [         |                     |
| metadata (Object) |           |   { student (Ref),|---------------------+
| timestamps        |           |     status }      |
+-------------------+           | ]                 |
                                | timestamps        |
+-------------------+           +-------------------+           +-------------------+
|       Alert       |                                           |      Message      |
+-------------------+                                           +-------------------+
| _id (ObjectId)    |                                           | _id (ObjectId)    |
| sender (Ref User) |                                           | sender (Ref User) |
| senderName        |                                           | senderName        |
| message (String)  |                                           | text (String)     |
| type (String)     |                                           | isRead (Boolean)  |
| timestamps        |                                           | timestamps        |
+-------------------+                                           +-------------------+
```

### 7.1 Detailed Field Specifications

#### 1. `User` Schema (`users` collection)
- `_id`: `mongoose.Schema.Types.ObjectId` (Primary Key, Auto-generated)
- `role`: `String`, `enum: ["admin", "volunteer"]`, `default: "admin"`
- `name`: `String`, `required: true`, `trim: true`
- `email`: `String`, `required: true`, `unique: true`, `lowercase: true`, `trim: true`
- `password`: `String`, `required: true` (BCrypt hashed string)
- `profilePicUrl`: `String`, `default: ""`
- `profilePicPublicId`: `String`, `default: ""` (Cloudinary asset ID)
- `phone`: `String`, `default: ""`
- `createdAt` / `updatedAt`: `Date` (Automated `timestamps: true`)

#### 2. `Student` Schema (`students` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `name`: `String`, `required: true`, `trim: true`
- `rollNo`: `String`, `required: true`, `trim: true`
- `section`: `String`, `required: true`, `trim: true` (e.g., "GRADE 8A")
- `phone`: `String`, `trim: true`, `default: ""`
- `parentPhone`: `String`, `trim: true`, `default: ""`
- `notes`: `String`, `trim: true`, `default: ""`
- `admin`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- **Indexes:** Compound unique index `{ admin: 1, section: 1, rollNo: 1 }`

#### 3. `Class` Schema (`classes` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `subject`: `String`, `required: true`, `trim: true`
- `date`: `String`, `required: true`, `default: YYYY-MM-DD`
- `day`: `String`, `required: true`, `enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]`
- `startTime`: `String`, `required: true`, `match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/` (HH:MM)
- `endTime`: `String`, `required: true`, `match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/` (HH:MM)
- `admin`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- `assignedVolunteer`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`
- `youtubeLink`: `String`, `trim: true`
- **Indexes:** Compound index `{ admin: 1, day: 1 }`

#### 4. `Attendance` Schema (`attendances` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `class`: `mongoose.Schema.Types.ObjectId`, `ref: "Class"`, `required: true`
- `admin`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- `takenBy`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`
- `date`: `Date`, `required: true`
- `note`: `String`, `trim: true`, `default: ""`
- `records`: Array of subdocuments:
  - `student`: `mongoose.Schema.Types.ObjectId`, `ref: "Student"`, `required: true`
  - `status`: `String`, `enum: ["present", "absent"]`, `required: true`
- **Indexes:** Compound unique index `{ class: 1, date: 1 }`

#### 5. `ClassPhoto` Schema (`classphotos` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `volunteer`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- `class`: `mongoose.Schema.Types.ObjectId`, `ref: "Class"`, `required: true`
- `imageUrl`: `String`, `required: true`
- `publicId`: `String`, `required: true`
- `location`: Nested object `{ lat: Number, lng: Number, accuracy: Number, address: String }`
- `takenAt`: `Date`, `required: true`
- `metadata`: Nested object `{ classDate: String, classTime: String, subject: String }`

#### 6. `Alert` Schema (`alerts` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `sender`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- `senderName`: `String`, `required: true`
- `message`: `String`, `required: true`, `trim: true`
- `type`: `String`, `default: "info"`

#### 7. `Message` Schema (`messages` collection)
- `_id`: `mongoose.Schema.Types.ObjectId`
- `sender`: `mongoose.Schema.Types.ObjectId`, `ref: "User"`, `required: true`
- `senderName`: `String`, `required: true`
- `text`: `String`, `required: true`, `trim: true`
- `isRead`: `Boolean`, `default: false`

---

## 8. Entity Relationships

```text
User (Admin) "1"  <--->  "N" Student       (Aggregation: Admin owns Student records)
User (Admin) "1"  <--->  "N" Class         (Composition: Admin manages Classes)
User (Vol)   "0..1"<-->  "N" Class         (Association: Class assigned to Volunteer)
Class        "1"  <--->  "N" Attendance    (Composition: Attendance sessions belong to Class)
User (Vol)   "1"  <--->  "N" Attendance    (Association: Attendance marked by Volunteer)
Student      "1"  <--->  "N" Att.Record    (Association: Student referenced in Attendance records)
Class        "1"  <--->  "N" ClassPhoto    (Composition: Class photos taken for Class)
User (Vol)   "1"  <--->  "N" ClassPhoto    (Association: Photo captured by Volunteer)
User (Admin) "1"  <--->  "N" Alert         (Association: Admin broadcasts Alert)
User (Vol)   "1"  <--->  "N" Message       (Association: Volunteer sends Message to Admin)
```

- **User to Student (One-to-Many):** One Admin user creates and owns multiple `Student` documents.
- **User to Class (One-to-Many):** One Admin user owns multiple `Class` documents. One Volunteer user can be assigned to multiple `Class` documents (`assignedVolunteer`).
- **Class to Attendance (One-to-Many):** One `Class` document has multiple daily `Attendance` session records.
- **Attendance to Student (Many-to-Many via Embedded Subdocuments):** An `Attendance` document contains an array of `records`, each referencing a `Student` ID and storing status.
- **Class to ClassPhoto (One-to-Many):** One `Class` document can have multiple webcam capture photos.
- **User to Alert / Message (One-to-Many):** Users reference `Alert` and `Message` documents as `sender`.

---

## 9. Business Logic & Services

Because Express handles controllers directly without an isolated domain service layer, business logic resides within the `controllers/` directory:

1. **Volunteer Class Overlap Enforcement (`class.controller.js -> createClass`):**
   - When creating a class with an `assignedVolunteer`, the system checks:
     `Class.findOne({ assignedVolunteer, date, $and: [ { startTime: { $lt: endTime } }, { endTime: { $gt: startTime } } ] })`.
   - If an overlapping record exists, HTTP 400 Bad Request is returned ("Volunteer is busy during this time slot").
2. **Attendance Authorization & Duplicate Guard (`attendance.controller.js -> markAttendance`):**
   - Verifies user ownership: `req.userId` must match `classDoc.admin` OR `classDoc.assignedVolunteer`.
   - Checks existing attendance: `Attendance.findOne({ class: classId, date: new Date(date) })`. Rejects duplicate attempts.
   - Validates that provided student IDs exist in the database.
3. **In-Memory Caching for Gemini AI Insights (`attendance.controller.js -> getAIInsightsPrompt`):**
   - Implements a cache map `aiInsightsCache = new Map()` with `AI_CACHE_TTL = 300000` (5 minutes).
   - If `ai_insights_<classId>` exists and `Date.now() - timestamp < TTL`, returns cached response immediately.
   - On cache miss, calculates attendance statistics, builds prompt, calls Gemini REST endpoint (`gemini-2.5-flash:generateContent`), updates cache, and returns output.
4. **Webcam Geotagged Image Capture (`photo.controller.js -> uploadClassPhoto`):**
   - Receives Base64 data URI image string from client.
   - Uploads to Cloudinary (`folder: 'stuma/class-captures'`, max width 1280px).
   - Saves `ClassPhoto` document containing geolocation (`lat`, `lng`, `accuracy`) and class metadata.
5. **Profile Picture Transformation (`photo.controller.js -> uploadProfilePic`):**
   - Accepts Base64 image, deletes user's previous `profilePicPublicId` from Cloudinary if set.
   - Uploads new image with transformation `{ width: 400, height: 400, crop: 'fill', gravity: 'face' }`.
   - Updates `User.profilePicUrl` and `User.profilePicPublicId`.

---

## 10. Request Lifecycle

Below is the step-by-step lifecycle of an API request (e.g., Marking Attendance):

```text
[Client Browser]
  │ 1. User clicks "Submit Attendance" in UI
  │ 2. Form state validated in `AttendancePage.jsx`
  ▼
[Axios API Client - `api.js`]
  │ 3. Request Interceptor executes
  │ 4. Extracts token from `localStorage.getItem('token')`
  │ 5. Sets Header `Authorization: Bearer <token>`
  │ 6. Dispatches HTTP POST to `http://localhost:5000/api/attendance`
  ▼
[Node.js / Express Server - `app.js`]
  │ 7. CORS Middleware validates Origin header
  │ 8. `express.json({ limit: '15mb' })` parses JSON body into `req.body`
  │ 9. Router matches path `/api/attendance` -> `attendance.routes.js`
  ▼
[Express Router & Middleware Chain]
  │ 10. Executes `auth.middleware.js` (`protect`):
  │     a. Verifies JWT signature against `process.env.JWT_SECRET`
  │     b. Queries DB: `User.findById(decoded.id)`
  │     c. Attaches `req.userId` and `req.user`
  │ 11. Executes `attendance.validator.js` (`markAttendanceValidation`):
  │     a. Validates class MongoId, ISO date, records array
  │     b. If validation fails -> Short-circuit with 400 Bad Request
  ▼
[Controller Layer - `attendance.controller.js`]
  │ 12. `markAttendance(req, res)` executes:
  │     a. Checks `Class.findById(classId)`
  │     b. Verifies role permissions (Admin or Assigned Volunteer)
  │     c. Queries `Attendance.findOne({ class, date })` for duplicates
  │     d. Invokes `Attendance.create()` -> Persists to MongoDB
  │     e. Populates references: `.populate("class").populate("records.student")`
  ▼
[Express Response Pipeline]
  │ 13. Responds with HTTP 201 Created `{ success: true, attendance: ... }`
  ▼
[Axios Response Interceptor - `api.js`]
  │ 14. Response Interceptor catches HTTP 201, logs dev info, returns data
  ▼
[React Component - `AttendancePage.jsx`]
  │ 15. Promise resolves -> Sets `success` banner -> Navigates to `/analytics`
```

---

## 11. Frontend Architecture

### 11.1 Component Tree & Layout System
- **Entry Point:** `main.jsx` -> `App.jsx` -> `BrowserRouter`.
- **Top-Level Providers:** `ThemeProvider` (handles dark/light mode toggle and `data-theme` attribute) and `AuthProvider` (manages user state, login, logout, and token restoration).
- **Routing Engine:** React Router v7 configuring routes wrapped by `ProtectedRoute` and `Layout`.
- **Layout Shell (`Layout.jsx`):**
  - Displays dynamic decorative vector grid background (`PageBackground`).
  - Renders responsive `Sidebar.jsx` (which toggles desktop collapse state and mobile drawer).
  - Renders active route component via `<Outlet />`.
  - Displays global footer credits.
  - Conditionally renders `VolunteerChatWidget` and `VolunteerCaptureWidget` if `currentUser.role === 'volunteer'`.

### 11.2 Pages Summary
- `LoginPage`: Dual-tab login screen for Admin and Volunteer roles.
- `DashboardPage`: Routes to `VolunteerDashboard` for volunteers or renders Admin resource metric overview.
- `ClassesPage`: Timetable management with interactive week offset picker and modal class creator.
- `VolunteerSchedulePage`: Read-only timetable grid filtered specifically for the logged-in volunteer.
- `StudentsPage`: Roster view grouped by section, supporting student creation and student detail drawer.
- `AttendancePage`: Interactive attendance marking interface with bulk toggles and note field.
- `AnalyticsPage`: Renders `AdminAnalytics` (Gemini AI prompt runner, Doughnut/Bar charts) or `VolunteerAnalytics` (personal hour metrics and progress doughnut).
- `VolunteersPage`: Admin panel for creating/editing/deleting volunteers and reading volunteer chat inbox.
- `GalleryPage`: Masonry-style geotagged class photo wall with modal lightbox and Google Maps link.
- `ProfilePage`: User profile editor, webcam/file profile picture upload, and account logout.

---

## 12. Backend Architecture

### 12.1 Pipeline & Layering
```text
HTTP Request ---> [CORS / JSON Parsers] ---> [Auth Guard] ---> [express-validator] ---> [Controller] ---> [Mongoose Models] ---> [MongoDB Atlas]
                                                                                            │
                                                                                            ├---> [Cloudinary SDK]
                                                                                            └---> [Google Gemini API]
```

### 12.2 Global Error Handling Strategy
Express error handling is centralized in `middleware/error.middleware.js`:
- `notFound` Middleware: Catches requests to unmapped routes, returning HTTP 404 `{ success: false, message: "Route ... not found" }`.
- `errorHandler` Middleware: Catches thrown errors or passed `next(err)` calls and formats response based on error type:
  - `ValidationError` (Mongoose): Returns HTTP 400 with array of validation error messages.
  - `MongoError` code `11000` (Duplicate Key): Returns HTTP 400 `"Duplicate value for <field>"`.
  - `CastError` (Invalid ObjectId): Returns HTTP 400 `"Invalid <path>: <value>"`.
  - `JsonWebTokenError` / `TokenExpiredError`: Returns HTTP 401 `"Invalid token"` or `"Token expired"`.
  - Uncaught Errors: Returns HTTP 500 `"Internal server error"` (including stack trace in development mode).

---

## 13. External Services

1. **Google Gemini AI API (`gemini-2.5-flash`):**
   - **Purpose:** Generates educational analysis summaries and classroom health reports based on attendance percentages.
   - **Integration Point:** `attendance.controller.js` (`getAIInsightsPrompt` and `getOverallAIInsights`).
   - **Transport:** Server-side Axios HTTP POST request to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`.
2. **Cloudinary Cloud Storage (v2 SDK):**
   - **Purpose:** Secure cloud image hosting, thumbnail creation, face-detection cropping, and auto-optimization.
   - **Integration Point:** `config/cloudinary.js` and `photo.controller.js`.
   - **Operations:**
     - Class webcam captures: `cloudinary.uploader.upload(base64, { folder: 'stuma/class-captures', transformation: [{ width: 1280, crop: 'limit' }, { quality: 'auto:good' }] })`.
     - Profile avatars: `cloudinary.uploader.upload(base64, { folder: 'stuma/profile-pics', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] })`.
     - Image deletion: `cloudinary.uploader.destroy(publicId)`.
3. **Browser Native Web APIs:**
   - **Geolocation API:** `navigator.geolocation.getCurrentPosition()` captures latitude, longitude, and accuracy in `VolunteerCaptureWidget`.
   - **MediaDevices WebRTC Camera API:** `navigator.mediaDevices.getUserMedia({ video: true })` streams live video feeds to `<video>` elements in webcam capture widgets.
   - **HTML5 Canvas 2D API:** Bakes GPS coordinates, timestamp string, and class subject text directly onto image pixels before uploading.

---

## 14. Environment Variables

### 14.1 Server Environment Variables (`server/.env`)
| Variable | Purpose | Used In | Required? |
| :--- | :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Atlas / Local connection string | `server.js` | **Yes** |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | `auth.controller.js`, `auth.middleware.js` | **Yes** |
| `PORT` | HTTP server port (Default: `5000`) | `server.js` | Optional |
| `NODE_ENV` | Environment mode (`development` / `production`) | `server.js`, `app.js`, `error.middleware.js` | Optional |
| `GEMINI_API_KEY` | Google Gemini AI REST API Key | `attendance.controller.js` | **Yes** (For AI features) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `config/cloudinary.js` | **Yes** (For Photo upload) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `config/cloudinary.js` | **Yes** (For Photo upload) |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `config/cloudinary.js` | **Yes** (For Photo upload) |

### 14.2 Client Environment Variables (`client/.env.local`)
| Variable | Purpose | Used In | Required? |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base HTTP URL of backend Express API | `services/api.js`, `main.jsx` | **Yes** (Defaults to `http://localhost:5000`) |
| `VITE_GEMINI_API_KEY` | Legacy client-side API key (deprecated in favor of backend proxy) | `.env.local` | No |

---

## 15. Sequence Flows

### 15.1 User Login Sequence Flow
```text
User            LoginPage        AuthContext         Axios api.js         Express Router       Auth Controller      User Model
 │                  │                 │                   │                     │                     │                  │
 │--1. Fill Form--->|                 │                   │                     │                     │                  │
 │--2. Click Login->|                 │                   │                     │                     │                  │
 │                  |--3. login()---->|                   │                     │                     │                  │
 │                  │                 |--4. authAPI.login>|                     │                     │                  │
 │                  │                 │                   |--5. POST /api/auth/login------------------>|                  │
 │                  │                 │                   │                     │                     |--6. findOne()--->|
 │                  │                 │                   │                     │                     |<--7. User Doc----+
 │                  │                 │                   │                     │                     |--8. bcrypt.compare()
 │                  │                 │                   │                     │                     |--9. jwt.sign()   │
 │                  │                 │                   |<--10. 200 OK { token, user }--------------|                  │
 │                  │                 |--11. Store Token--|                   │                     │                  │
 │                  │                 |      in Storage   │                     │                     │                  │
 │                  |<--12. Success---|                   │                     │                     │                  │
 │<--13. Redirect---|                 │                   │                     │                     │                  │
```

### 15.2 Volunteer Webcam Geotagged Photo Capture Flow
```text
Volunteer       CaptureWidget      Browser GPS        MediaDevices        HTML5 Canvas         Photos API         Cloudinary / DB
    │                 │                 │                  │                   │                   │                     │
    │--1. Click Cam-->|                 │                  │                   │                   │                     │
    │                 |--2. Get GPS--->|                  │                   │                   │                     │
    │                 |<--3. Lat/Lng----+                  │                   │                   │                     │
    │                 |--4. getUserMedia()---------------->|                   │                   │                     │
    │                 |<--5. Video Stream------------------|                   │                   │                     │
    │--6. Snap Photo->|                                                        │                   │                     │
    │                 |--7. Draw Frame & Bake Text Overlays------------------->|                   │                     │
    │                 |<--8. toDataURL('image/jpeg')---------------------------|                   │                     │
    │--9. Upload----->|                                                                                │                     │
    │                 |--10. POST /api/photos/capture------------------------------------------------->|                     │
    │                 │                                                                                |--11. Upload Base64->|
    │                 │                                                                                |<--12. Return URL---+
    │                 │                                                                                |--13. ClassPhoto.create()
    │                 |<--14. 201 Created { photo }----------------------------------------------------|                     │
    │<--15. Success---|                                                                                │                     │
```

---

## 16. Dependency Graph & Coupling Analysis

```text
[main.jsx]
   └── [App.jsx]
        ├── [ThemeProvider]
        ├── [AuthProvider] ──> [authAPI] ──> [api.js (Axios Singleton)]
        └── [BrowserRouter]
             ├── [ProtectedRoute] ──> [useAuth]
             ├── [AdminRoute] ──> [useAuth]
             └── [Layout]
                  ├── [Sidebar] ──> [AlertsDropdown] ──> [api.js]
                  ├── [VolunteerChatWidget] ──> [messagesAPI] ──> [api.js]
                  ├── [VolunteerCaptureWidget] ──> [photosAPI, classesAPI] ──> [api.js]
                  └── [Outlet (Pages)]
                       ├── [LoginPage] ──> [useAuth]
                       ├── [DashboardPage] ──> [VolunteerDashboard]
                       ├── [ClassesPage] ──> [classesAPI, authAPI, timetableUtils]
                       ├── [VolunteerSchedulePage] ──> [classesAPI, timetableUtils]
                       ├── [StudentsPage] ──> [StudentDetail] ──> [studentsAPI]
                       ├── [AttendancePage] ──> [attendanceAPI, classesAPI, studentsAPI]
                       ├── [AnalyticsPage] ──> [AdminAnalytics, VolunteerAnalytics] ──> [attendanceAPI, Chart.js]
                       ├── [VolunteersPage] ──> [AdminMessageInbox] ──> [authAPI, classesAPI, messagesAPI]
                       ├── [GalleryPage] ──> [photosAPI]
                       └── [ProfilePage] ──> [photosAPI, useAuth]
```

### 16.1 Architectural Coupling Assessment
- **Low Coupling / High Cohesion in Client Services:** Components rely exclusively on the `services/api.js` module for HTTP requests. Components do not instantiate raw Axios calls.
- **Backend Model Coupling:** Route files decouple endpoint paths from business logic by delegating immediately to controller functions.
- **Circular Dependencies:** 0 circular dependencies detected.
- **Unused / Legacy References:**
  - `server/package.json` includes both `bcrypt` and `bcryptjs`. `auth.controller.js` explicitly uses `bcryptjs`.
  - `client/.env.local` references `VITE_GEMINI_API_KEY` which is now deprecated in favor of the backend proxy in `attendance.controller.js`.

---

## 17. State Flow Specifications

1. **Authentication State:** Managed via `AuthContext`. State variables include `user`, `isAuthenticated`, and `isLoading`. Persistent backing store is `localStorage` (`token` and `user`).
2. **Theme State:** Managed via `ThemeContext`. State variable `isDarkMode` persisted in `localStorage['stuma-dark-mode']` and synced to `document.documentElement.setAttribute('data-theme', 'dark')`.
3. **UI Layout State:** Sidebar collapsed state (`sidebarCollapsed`) owned by `Layout.jsx` and passed to `Sidebar.jsx`, dynamically adjusting main content margin (`240px` expanded vs `64px` collapsed).
4. **Modal & Form States:** Local component state managed via React `useState` hooks (e.g., `isModalOpen`, `formData`, `isSubmitting`, `formError`).
5. **Request / Response State:** Component fetch flows follow standard status transitions: `isLoading: true` -> API Call -> `data` updated -> `isLoading: false` (or `error` set).

---

## 18. Event & Communication Flow

- **Synchronous REST Communication:** Client communicates with backend via Axios JSON over HTTP.
- **Browser Event Listeners:**
  - `Sidebar.jsx` attaches `mousedown` listener to close notifications dropdown on outside clicks.
  - `Modal.jsx` attaches `keydown` listener to handle `Escape` key dismissal and sets `document.body.style.overflow = 'hidden'`.
  - Timers: `DashboardPage`, `ClassesPage`, `VolunteerSchedulePage` mount 10-second or 1-second `setInterval` timers to update live clocks and evaluate active class slots.
- **WebRTC Camera Stream Events:** `VolunteerCaptureWidget` and `ProfilePage` control stream tracks via `stream.getTracks().forEach(track => track.stop())` upon component unmount or modal closure.

---

## 19. Class & Function Inventory

### 19.1 Controller Functions (`server/controllers/`)
- `auth.controller.js`: `register`, `login`, `getVolunteers`, `createVolunteer`, `updateVolunteer`, `deleteVolunteer`.
- `class.controller.js`: `createClass`, `getTodayClasses`, `getCurrentClass`, `getAllClasses`.
- `student.controller.js`: `addStudent`, `getAllStudents`, `getStudentStats`.
- `attendance.controller.js`: `markAttendance`, `getAttendanceByClass`, `attendanceAnalytics`, `attendanceChartData`, `getAIInsightsPrompt`, `getOverallAnalytics`, `getOverallAIInsights`.
- `photo.controller.js`: `uploadClassPhoto`, `getGallery`, `getPhotosByClass`, `deletePhoto`, `uploadProfilePic`, `updateProfile`, `getProfile`.
- `alert.controller.js`: `createAlert`, `getAlerts`.
- `message.controller.js`: `sendMessage`, `getMessages`, `markRead`.

### 19.2 Middleware Functions (`server/middleware/`)
- `auth.middleware.js`: `protect(req, res, next)`.
- `error.middleware.js`: `notFound(req, res, next)`, `errorHandler(err, req, res, next)`.

### 19.3 Utility Functions (`client/src/utils/`)
- `helpers.js`: `formatTime`, `formatDate`, `toISODateString`, `getCurrentDay`, `getCurrentTime`, `getDaysOfWeek`, `getAttendanceStatusClass`, `getAttendanceStatusLabel`, `truncateText`, `debounce`, `isValidEmail`, `capitalizeFirst`, `generateId`, `parseSimpleMarkdown`, `groupBy`, `isCurrentTimeInRange`, `formatRelativeTime`.
- `timetableUtils.js`: `getHoliday`, `isCurrentSlot`, `formatTimeRange`, `INDIAN_HOLIDAYS` dictionary.

---

## 20. Interfaces, Schemas & DTOs

### 20.1 Data Transfer Objects (DTOs)

#### User Auth DTO
```typescript
interface LoginDTO {
  email: string;
  password: string;
  role: 'admin' | 'volunteer';
}
interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'volunteer';
  profilePicUrl?: string;
  phone?: string;
}
```

#### Class Creation DTO
```typescript
interface CreateClassDTO {
  subject: string;
  date?: string; // YYYY-MM-DD
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  assignedVolunteer?: string; // ObjectId
  youtubeLink?: string;
}
```

#### Attendance Submission DTO
```typescript
interface AttendanceRecordDTO {
  student: string; // ObjectId
  status: 'present' | 'absent';
}
interface MarkAttendanceDTO {
  class: string; // ObjectId
  date: string;  // ISO Date String
  note?: string;
  records: AttendanceRecordDTO[];
}
```

#### Photo Upload DTO
```typescript
interface UploadPhotoDTO {
  imageBase64: string; // data:image/jpeg;base64,...
  classId: string;     // ObjectId
  location?: { lat?: number; lng?: number; accuracy?: number; address?: string };
  takenAt?: string;
  metadata?: { classDate?: string; classTime?: string; subject?: string };
}
```

---

## 21. Design Patterns

| Pattern | Implementation Location | Operational Role |
| :--- | :--- | :--- |
| **MVC** | Entire Server Directory (`models/`, `controllers/`, `routes/`) | Decouples MongoDB schemas from REST endpoint routing and business execution |
| **Provider Pattern** | `AuthContext.jsx`, `ThemeContext.jsx` | Encapsulates application-wide state and exposes custom hooks (`useAuth`, `useTheme`) |
| **Guard / Decorator** | `ProtectedRoute.jsx`, `AdminRoute.jsx` | Wraps React components to enforce authentication and RBAC permissions |
| **Service Adapter** | `client/src/services/api.js` | Abstracts raw Axios network calls into named API domain modules |
| **Middleware Chain** | `server/app.js`, Express Routes | Processes incoming HTTP requests through CORS, body parsing, auth, and validation |
| **In-Memory Caching** | `attendance.controller.js` (`aiInsightsCache`) | Caches Gemini AI API responses using a TTL `Map` to optimize latency & quota |
| **Portal Pattern** | `components/ui/Modal.jsx`, `GalleryPage.jsx` | Mounts floating overlay UI trees outside main DOM hierarchy via `createPortal` |

---

## 22. Security Implementation

1. **Authentication Security:** JWT signatures verified against server-secret `JWT_SECRET`. Tokens stored client-side in `localStorage`.
2. **Password Hashing:** Hashes user passwords with `bcryptjs` using a salt work factor of 10. Passwords are stripped from queries using Mongoose `.select('-password')`.
3. **Role-Based Authorization (RBAC):** Backend checks `req.user.role` before performing admin operations (e.g., deleting photos, adding volunteers, broadcasting alerts).
4. **Input Sanitization & Validation:** `express-validator` middleware normalizes emails, validates length boundaries, and ensures correct formats.
5. **CORS Policy:** Express `cors()` restricts cross-origin access to explicit frontend domains (`http://localhost:5173`, `https://stumafrontend.vercel.app`, `http://localhost:3000`).
6. **Vite Security Headers (`vite.config.js`):** Configures HTTP server response headers:
   - `Permissions-Policy: camera=*, microphone=*, geolocation=*`
   - `Cross-Origin-Embedder-Policy: credentialless`
   - `Cross-Origin-Opener-Policy: same-origin`
7. **NoSQL Injection Defense:** Mongoose schema casting converts string parameters into strongly-typed ObjectIds.

---

## 23. Error Handling Architecture

- **Server-Side Exception Handling:** Controllers wrap async operations in `try/catch` blocks. Unhandled rejections propagate to `errorHandler` in `middleware/error.middleware.js`.
- **Axios HTTP Response Interceptor:** Catches HTTP 401 Unauthorized errors globally, automatically purging `localStorage` tokens and redirecting browser location to `/login`.
- **Client-Side Failure UI:** Components utilize the `<Alert type="error" message={error} />` component to render inline user feedback on validation or server errors.
- **Graceful Third-Party Degradation:** If Gemini API key is missing or quota is exceeded, `attendance.controller.js` catches the error and returns formatted raw attendance statistics alongside a descriptive error message.

---

## 24. Performance Optimizations

1. **AI Insights Caching:** `AttendanceController` utilizes an in-memory `Map` cache with a 5-minute TTL (`300,000 ms`), preventing duplicate calls to Gemini API for identical class statistics.
2. **Database Indexing:**
   - `Student` schema: `{ admin: 1, section: 1, rollNo: 1 }` (Unique compound index).
   - `Class` schema: `{ admin: 1, day: 1 }`.
   - `Attendance` schema: `{ class: 1, date: 1 }` (Unique compound index).
3. **Lean Database Queries:** Server uses `.lean()` on read-only aggregations (e.g., `getOverallAnalytics`) to bypass Mongoose document instantiation overhead.
4. **Cloudinary Asset Optimization:** Automatic image resolution capping (1280px limit for webcam captures, 400x400 face-cropping for avatars) and auto-quality encoding (`quality: 'auto:good'`).
5. **Media Stream Cleanup:** WebRTC media tracks are stopped (`track.stop()`) immediately when webcam capture modals close to free system camera resources.

---

## 25. UML Mapping Section

This section contains complete specification data required to generate standard UML diagrams.

### 25.1 Use Case Diagram Mapping
- **Actors:**
  - `Teacher / Admin`: Manages schedules, rosters, volunteers, views analytics, broadcasts alerts.
  - `Volunteer`: Views schedule, marks attendance, captures geotagged class webcam photos, messages admin.
  - `Google Gemini AI`: External system generating analytical reports.
  - `Cloudinary API`: External system storing and transforming images.
- **Use Cases:**
  - UC-1: Authenticate User (Login / JWT Issue)
  - UC-2: Manage Timetable (Create / View Classes)
  - UC-3: Manage Student Roster (Add Student / View Stats)
  - UC-4: Manage Volunteer Accounts (Add / Edit / Delete Volunteer)
  - UC-5: Mark Attendance (Present / Absent / Notes)
  - UC-6: Capture Geotagged Class Photo (Webcam + GPS + Canvas Text Overlay)
  - UC-7: Generate AI Attendance Insights (Invoke Gemini Proxy)
  - UC-8: Broadcast Global Alert (Admin Alert Creation)
  - UC-9: Send / Read Volunteer Messages (Volunteer Chat & Admin Inbox)

### 25.2 Class Diagram Mapping
- **Classes:** `User`, `Student`, `Class`, `Attendance`, `ClassPhoto`, `Alert`, `Message`, `AuthController`, `ClassController`, `StudentController`, `AttendanceController`, `PhotoController`, `AlertController`, `MessageController`, `AuthMiddleware`, `ErrorMiddleware`, `APIService`, `AuthContext`.
- **Relationships:**
  - `User` "1" -- "0..*" `Student` (Aggregation)
  - `User` "1" -- "0..*" `Class` (Composition - Admin owns Class)
  - `User` "0..1" -- "0..*" `Class` (Association - Assigned Volunteer)
  - `Class` "1" -- "0..*" `Attendance` (Composition)
  - `Class` "1" -- "0..*" `ClassPhoto` (Composition)
  - `User` "1" -- "0..*" `Alert` (Association - Sender)
  - `User` "1" -- "0..*" `Message` (Association - Sender)

### 25.3 ER Diagram Mapping
- **Entities & Tables:**
  - `users` (`_id`, `role`, `name`, `email`, `password`, `profilePicUrl`, `profilePicPublicId`, `phone`, `createdAt`, `updatedAt`)
  - `students` (`_id`, `name`, `rollNo`, `section`, `phone`, `parentPhone`, `notes`, `admin`, `createdAt`, `updatedAt`)
  - `classes` (`_id`, `subject`, `date`, `day`, `startTime`, `endTime`, `admin`, `assignedVolunteer`, `youtubeLink`, `createdAt`, `updatedAt`)
  - `attendances` (`_id`, `class`, `admin`, `takenBy`, `date`, `note`, `records`, `createdAt`, `updatedAt`)
  - `classphotos` (`_id`, `volunteer`, `class`, `imageUrl`, `publicId`, `location`, `takenAt`, `metadata`, `createdAt`, `updatedAt`)
  - `alerts` (`_id`, `sender`, `senderName`, `message`, `type`, `createdAt`, `updatedAt`)
  - `messages` (`_id`, `sender`, `senderName`, `text`, `isRead`, `createdAt`, `updatedAt`)
- **Foreign Keys / References:**
  - `students.admin` -> `users._id`
  - `classes.admin` -> `users._id`
  - `classes.assignedVolunteer` -> `users._id`
  - `attendances.class` -> `classes._id`
  - `attendances.admin` -> `users._id`
  - `attendances.takenBy` -> `users._id`
  - `attendances.records.student` -> `students._id`
  - `classphotos.volunteer` -> `users._id`
  - `classphotos.class` -> `classes._id`
  - `alerts.sender` -> `users._id`
  - `messages.sender` -> `users._id`

### 25.4 Sequence Diagram Mapping
- **Participants:** `User Client`, `AuthMiddleware`, `AttendanceController`, `CacheMap`, `GeminiAPI`, `MongoDB`.
- **Order of Messages:**
  1. Client -> Server: `GET /api/attendance/ai-insights/:classId` (Header: `Bearer <token>`)
  2. Server -> `AuthMiddleware`: Validate JWT
  3. `AuthMiddleware` -> `MongoDB`: `User.findById(userId)`
  4. `MongoDB` -> `AuthMiddleware`: Return User
  5. Server -> `AttendanceController`: `getAIInsightsPrompt(req, res)`
  6. `AttendanceController` -> `CacheMap`: `get(cacheKey)`
  7. If Cache Hit: Return cached response to Client.
  8. If Cache Miss: `AttendanceController` -> `MongoDB`: Query Class, Student, Attendance records
  9. `MongoDB` -> `AttendanceController`: Return aggregated metrics
  10. `AttendanceController` -> `GeminiAPI`: HTTP POST prompt to `generativelanguage.googleapis.com`
  11. `GeminiAPI` -> `AttendanceController`: Return generated insights text
  12. `AttendanceController` -> `CacheMap`: `set(cacheKey, responseData)`
  13. `AttendanceController` -> Client: HTTP 200 OK JSON `{ success: true, text: ... }`

---

## 26. Mermaid Mapping

Structured Mermaid node and sequence specifications (ready for Mermaid generator rendering):

### 26.1 Class Relationships Diagram Data
```text
classDiagram
    class User {
        +ObjectId _id
        +String role
        +String name
        +String email
        +String password
        +String profilePicUrl
        +String phone
    }
    class Student {
        +ObjectId _id
        +String name
        +String rollNo
        +String section
        +ObjectId admin
    }
    class Class {
        +ObjectId _id
        +String subject
        +String day
        +String startTime
        +String endTime
        +ObjectId admin
        +ObjectId assignedVolunteer
    }
    class Attendance {
        +ObjectId _id
        +ObjectId class
        +ObjectId admin
        +ObjectId takenBy
        +Date date
        +Array records
    }
    class ClassPhoto {
        +ObjectId _id
        +ObjectId volunteer
        +ObjectId class
        +String imageUrl
        +Object location
    }

    User "1" -- "*" Student : owns
    User "1" -- "*" Class : creates
    User "0..1" -- "*" Class : assigned_to
    Class "1" -- "*" Attendance : has_sessions
    Class "1" -- "*" ClassPhoto : captures
    Student "1" -- "*" Attendance : recorded_in
```

### 26.2 Sequence Diagram Data
```text
sequenceDiagram
    autonumber
    actor Volunteer
    participant Client as React Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant Cloudinary as Cloudinary API
    participant DB as MongoDB Atlas

    Volunteer->>Client: Clicks "Take Photo"
    Client->>Client: Requests GPS & Camera Permissions
    Client->>Client: Bakes GPS & Timestamp onto Canvas
    Volunteer->>Client: Clicks "Upload Photo"
    Client->>API: POST /api/photos/capture (Base64 + GPS)
    API->>Auth: Protect Middleware (Verify JWT)
    Auth-->>API: Authorized (req.userId)
    API->>Cloudinary: uploader.upload(base64)
    Cloudinary-->>API: Returns secure_url & public_id
    API->>DB: ClassPhoto.create(...)
    DB-->>API: Returns saved Photo Document
    API-->>Client: HTTP 201 Created { photo }
    Client-->>Volunteer: Displays "Photo Uploaded!"
```

---

## 27. PlantUML Mapping

Structured PlantUML specifications:

```text
@startuml
package "Client Tier (React 19 / Vite)" {
  [App] ..> [AuthProvider]
  [App] ..> [ThemeProvider]
  [AuthProvider] ..> [api.js]
  [Layout] ..> [Sidebar]
  [Layout] ..> [VolunteerCaptureWidget]
  [Layout] ..> [VolunteerChatWidget]
  [VolunteerCaptureWidget] ..> [api.js]
}

package "Server Tier (Express.js v5)" {
  [app.js] ..> [auth.middleware]
  [app.js] ..> [error.middleware]
  [auth.routes] ..> [auth.controller]
  [class.routes] ..> [class.controller]
  [attendance.routes] ..> [attendance.controller]
  [photo.routes] ..> [photo.controller]
}

database "Persistence Tier" {
  [MongoDB Atlas]
}

cloud "External Cloud Services" {
  [Cloudinary SDK]
  [Google Gemini AI REST API]
}

[api.js] ==> [app.js] : HTTP / REST JSON
[auth.controller] --> [MongoDB Atlas] : Mongoose ODM
[class.controller] --> [MongoDB Atlas] : Mongoose ODM
[attendance.controller] --> [MongoDB Atlas] : Mongoose ODM
[attendance.controller] --> [Google Gemini AI REST API] : HTTPS POST
[photo.controller] --> [Cloudinary SDK] : Media Upload
@enduml
```

---

## 28. Architectural Summary

### 28.1 System Strengths
1. **Clean Separation of Concerns:** Clear multi-tier decoupling between Vite/React client, Express server, and MongoDB database.
2. **Robust Role-Based Routing & Access Control:** Role differentiation (`admin` vs `volunteer`) is strictly enforced on both frontend routes (`AdminRoute`) and backend middleware.
3. **Resilient Geotagged Capture Pipeline:** Client-side HTML5 canvas overlay baking ensures GPS location and timestamps are burned into image pixels before upload, preventing tampering.
4. **Performant AI Caching:** In-memory 5-minute TTL caching prevents Gemini API quota exhaustion and eliminates redundant network calls.
5. **Polished User Experience:** Modern CSS glassmorphism, responsive drawer transitions, skeleton loading states, and custom alert systems deliver a high-end application interface.

### 28.2 System Weaknesses & Code Smells
1. **Controller Monoliths:** `attendance.controller.js` (~582 lines) contains analytical aggregation logic, Gemini REST requests, in-memory caching, and chart dataset generation.
   - *Refactoring Opportunity:* Extract an independent `services/ai.service.js` and `services/analytics.service.js`.
2. **Duplicate Password Hashing Packages:** `server/package.json` includes both `bcrypt` and `bcryptjs`.
   - *Refactoring Opportunity:* Remove `bcrypt` from `package.json` to reduce bundle overhead.
3. **Legacy API Keys:** `client/.env.local` contains `VITE_GEMINI_API_KEY` which is unused because AI logic was migrated to backend proxying.
   - *Refactoring Opportunity:* Clean up unused client-side environment keys.

### 28.3 Scalability & Maintainability Scores
- **Scalability Score:** **8.5 / 10** (Stateless JWT authentication and externalized media/AI processing allow horizontal server scaling behind a load balancer; in-memory cache should be migrated to Redis for multi-instance deployments).
- **Maintainability Score:** **9.0 / 10** (Strong modular folder layout, explicit validation rules, comprehensive error handling middleware, and clean React context organization).

---
*End of Architectural & Reverse Engineering Specification for STUMA.*
