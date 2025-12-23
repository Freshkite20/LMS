import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { CourseCreation } from './components/CourseCreation';
import { CoursePreview } from './components/CoursePreview';
import { StudentEnrollment } from './components/StudentEnrollment';
import { BatchManagement } from './components/BatchManagement';
import { CourseAssignment } from './components/CourseAssignment';
import { TestModuleUpload } from './components/TestModuleUpload';
import { CourseViewer } from './components/CourseViewer';
import { TestModule } from './components/TestModule';
import { authService } from './services/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const result = await authService.login(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setCurrentView(result.user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    }
    return result;
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedCourse(null);
    setSelectedTest(null);
  };

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setCurrentView('course-viewer');
  };

  const handleViewTest = (test: any) => {
    setSelectedTest(test);
    setCurrentView('test-module');
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
    setSelectedTest(null);
    setCurrentView(currentUser?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  };

  if (currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-blue-600">Training Management System</h1>
            {currentUser && (
              <span className="text-gray-500 text-sm">
                {currentUser.role === 'admin' ? 'Admin' : 'Student'} Portal
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <>
                <span className="text-sm text-gray-600">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            onNavigate={setCurrentView}
            onViewCourse={handleViewCourse}
          />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboard
            user={currentUser}
            onViewCourse={handleViewCourse}
            onViewTest={handleViewTest}
          />
        )}

        {currentView === 'course-creation' && (
          <CourseCreation onBack={handleBackToDashboard} />
        )}

        {currentView === 'course-preview' && (
          <CoursePreview onBack={handleBackToDashboard} />
        )}

        {currentView === 'student-enrollment' && (
          <StudentEnrollment onBack={handleBackToDashboard} />
        )}

        {currentView === 'batch-management' && (
          <BatchManagement onBack={handleBackToDashboard} />
        )}

        {currentView === 'course-assignment' && (
          <CourseAssignment onBack={handleBackToDashboard} />
        )}

        {currentView === 'test-upload' && (
          <TestModuleUpload onBack={handleBackToDashboard} />
        )}

        {currentView === 'course-viewer' && selectedCourse && (
          <CourseViewer
            course={selectedCourse}
            onBack={handleBackToDashboard}
            userRole={currentUser?.role}
          />
        )}

        {currentView === 'test-module' && selectedTest && (
          <TestModule
            test={selectedTest}
            courseId={selectedTest.courseId}
            studentId={currentUser?.id}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}
