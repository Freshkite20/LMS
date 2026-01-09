# Training Management System (TMS)

## 📋 Project Overview
A comprehensive training management system that enables administrators to manage courses, track student progress, and conduct tests. Students can enroll in courses, view content, and take assessments.

---

## 🚀 Features

### Admin Features:
- Create and manage courses
- Upload course materials (videos, documents, images)
- Create and upload tests (Excel format)
- Manage student batches and enrollments
- Track student progress and performance
- Integration with Google Docs for course creation
- Cloudinary integration for media storage

### Student Features:
- View enrolled courses and progress
- Access course materials (videos, documents)
- Take tests and view results
- Track course completion status
- Real-time progress tracking

---

## 🛠️ Tech Stack

### Frontend:
- React with TypeScript
- Vite


### Backend:
- Node.js with TypeScript
- Express.js
- MongoDB (Database)
- Keycloak (Authentication)
- Cloudinary (Image/File Storage)

---

## 📦 Installation

### Prerequisites:
- Node.js 
- MongoDB
- Keycloak server
- npm

### Backend Setup:
```bash
cd TMS-BE
npm install

# Create .env file with required variables (see Environment Variables section)

# Run in development mode
npm run dev
```

### Frontend Setup:
```bash
cd "Frontend/Training Management System-Python"
npm install

# Create .env file with required variables (see Environment Variables section)

# Run in development mode
npm run dev
```

---

### 🔐 Environment Variables

### Backend (.env):
Create a `.env` file in the `TMS-BE` directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI= mongodb+srv://username:password@cluster0.oz3xgkz.mongodb.net/lms_project?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=mongo

# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=lms-realm
KEYCLOAK_CLIENT_ID=tms-backend
KEYCLOAK_CLIENT_SECRET=<SECRET>

# File Storage
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads







```

---

## 🚀 Running the Application

1. **Start MongoDB** - Ensure MongoDB is running
2. **Start Keycloak** - Ensure Keycloak server is running
3. **Start Backend Server**:
   ```bash
   cd TMS-BE
   npm run dev
   ```
4. **Start Frontend**:
   ```bash
   cd "Frontend/Training Management System-Python"
   npm run dev
   ```

The application should now be running:
- Frontend: `http://localhost:5173` 
- Backend: `http://localhost:3000`

---

## 📁 Project Structure

```

├── TMS-BE/                 # Backend application
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB models
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── openapi.yaml        # API documentation
│   └── package.json
│
└── Frontend/
    └── Training Management System-Python/
        ├── src/
        │   ├── components/ # React components
        │   ├── utils/      # Utility functions
        │   └── App.tsx     # Main application
        └── package.json
```

---

## 🔑 Key Components

### Backend:
- **Course Management**: Create, update, and manage courses
- **Test System**: Upload and manage tests, track submissions
- **Batch Management**: Organize students into batches
- **Progress Tracking**: Monitor student progress across courses
- **File Management**: Handle file uploads and storage

### Frontend:
- **Admin Dashboard**: Comprehensive admin interface
- **Student Dashboard**: Student progress and course access
- **Course Viewer**: Interactive course content viewer
- **Test Module**: Test-taking interface with submissions
- **Batch Management**: Interface for managing student groups

---

## 👥 User Roles

### Admin:
- Full access to all features
- Create and manage courses
- Manage student enrollments
- View all student progress

### Student:
- View enrolled courses
- Access course materials
- Take tests
- Track personal progress

---


---






## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---



