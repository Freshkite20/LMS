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
- Personal dashboard with statistics
- Real-time progress tracking

---

## 🛠️ Tech Stack

### Frontend:
- React with TypeScript
- Vite
- Modern UI components

### Backend:
- Node.js with TypeScript
- Express.js
- MongoDB (Database)
- Keycloak (Authentication & Authorization)
- Cloudinary (Image/File Storage)

---

## 📦 Installation

### Prerequisites:
- Node.js (v16 or higher)
- MongoDB
- Keycloak server
- npm or yarn

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

## 🔐 Environment Variables

### Backend (.env):
Create a `.env` file in the `TMS-BE` directory:
```env
MONGODB_URI=your_mongodb_connection_string
KEYCLOAK_URL=your_keycloak_url
KEYCLOAK_REALM=your_realm
KEYCLOAK_CLIENT_ID=your_client_id
KEYCLOAK_CLIENT_SECRET=your_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
```

### Frontend (.env):
Create a `.env` file in the `Frontend/Training Management System-Python` directory:
```env
VITE_API_URL=http://localhost:3000
VITE_KEYCLOAK_URL=your_keycloak_url
VITE_KEYCLOAK_REALM=your_realm
VITE_KEYCLOAK_CLIENT_ID=your_client_id
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
- Frontend: `http://localhost:5173` (or as specified by Vite)
- Backend: `http://localhost:3000`

---

## 📁 Project Structure

```
harsh/
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

## 🧪 Testing

```bash
# Backend tests
cd TMS-BE
npm test

# Frontend tests
cd "Frontend/Training Management System-Python"
npm test
```

---

## 📝 API Documentation

API documentation is available in the `openapi.yaml` file in the backend directory. You can view it using tools like Swagger UI.

---

## 👥 Team Members
- [Add team member names here]

---

## 📄 License
[Specify your license - MIT, Apache, etc.]

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


---

## 🙏 Acknowledgments

- MongoDB
- Keycloak
- Cloudinary
- React Team
- All contributors
