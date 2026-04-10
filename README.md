# 🎓 Stuma - Teacher Attendance Tracking System

A comprehensive, full-stack web application designed to streamline teacher workflow by providing intuitive attendance tracking, class scheduling, and AI-powered performance insights. Stuma bridges the gap between daily classroom management and actionable data analytics.


---

## ✨ Features

* **Interactive Dashboard:** Get a bird's-eye view of your current classes, today's schedule, and quick statistics.
* **Class Management:** Efficiently manage weekly timetables with a day-based organization system.
* **Student Roster:** Add, edit, and search through student records with ease.
* **Smart Attendance Marking:** Intuitive toggle interface for marking attendance, including bulk action capabilities.
* **Advanced Analytics:** Visualize attendance trends with beautiful charts and categorization.
* **AI-Powered Insights:** Leverage Gemini AI to generate actionable insights based on student attendance patterns.
* **Secure Authentication:** Robust JWT-based secure user authentication and session management.

---

## 🛠️ Tech Stack

**Frontend**
* React 19 (via Vite)
* React Router v7
* Tailwind CSS
* Chart.js & react-chartjs-2
* Axios

**Backend**
* Node.js & Express.js
* MongoDB & Mongoose
* JSON Web Tokens (JWT) & bcrypt
* Cloudinary & Multer (for media handling)

---

## 🚀 Installation

Follow these steps to get the project running locally.

### Prerequisites

* Node.js (v18 or higher)
* MongoDB instance (local or Atlas)

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/varadisthedev/stuma.git
   cd stuma
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Make sure to configure your .env file
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # Make sure to configure your .env file
   npm run dev
   ```

4. **Access the application**
   Open `http://localhost:5173` (or the port Vite provides) in your browser.

---

## 💻 Usage

1. **Register/Login:** Create a new teacher account or log in securely.
2. **Add Classes:** Navigate to the module settings to set up your weekly subjects and schedule.
3. **Enroll Students:** Add students to your roster manually or manage existing records.
4. **Mark Attendance:** Click on an active class from the dashboard to start toggling attendance statuses.
5. **View Analytics:** Head to the analytical dashboard to visualize attendance trends and request AI summaries.

---

## 📂 Project Structure

```text
STUMA/
├── client/                 # React Frontend code
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers (Auth)
│   │   ├── pages/          # Dashboard, Classes, Analytics, etc.
│   │   ├── services/       # Axios API interceptors & API layer
│   │   └── utils/          # Helper functions
│   └── package.json
└── server/                 # Express Backend code
    ├── config/             # Database and cloud configuration
    ├── controllers/        # Route logic and handlers
    ├── middleware/         # Auth verification, error handling
    ├── models/             # Mongoose schemas
    ├── routes/             # Express API routes
    ├── services/           # External service integration
    ├── validators/         # Request input validation rules
    └── package.json
```

---

## 🔌 API Documentation

Detailed backend implementation patterns and full API logic can be found in `server/QUICK_START.md`. Below is a brief overview of the core endpoints and patterns expected:

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/auth/register` | `POST` | Register a new teacher into the system |
| `/api/auth/login` | `POST` | Authenticate and retrieve a JWT |
| `/api/classes` | `GET` | Get all scheduled classes |
| `/api/classes` | `POST` | Create a new scheduled class |
| `/api/students` | `GET` | Retrieve the student roster |
| `/api/attendance` | `POST` | Submit daily attendance records |
| `/api/analytics` | `GET` | Fetch system attendance statistics |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🗺️ Roadmap / Future Improvements

* Add CSV export functionality for monthly attendance reports.
* Implement role-based access control (RBAC) to support admin and principal roles.
* Introduce automated email/push notifications for chronically absent students.
* Build a dedicated mobile application using React Native.
* Expand AI insights to predict student drop-out risks based on historical attendance trends.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👏 Acknowledgements

* [React](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Chart.js](https://www.chartjs.org/)
* [Google Gemini AI](https://deepmind.google/technologies/gemini/)
