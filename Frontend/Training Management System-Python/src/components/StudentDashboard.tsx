import { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, CheckCircle, Clock, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { studentService } from '../services/studentService';

interface StudentDashboardProps {
  user: any;
  onViewCourse: (course: any) => void;
  onViewTest: (test: any) => void;
}

export function StudentDashboard({ user, onViewCourse, onViewTest }: StudentDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const stats = await studentService.getDashboardStats();

        // Fetch courses using the student ID from stats
        let coursesData: any = { courses: [], tests: [] };
        if (stats && stats.id) {
          try {
            const responseData = await studentService.getStudentCourses(stats.id);
            // Backend might return { courses: [], statistics: {} } or just []
            const coursesList = Array.isArray(responseData) ? responseData : responseData.courses;

            if (Array.isArray(coursesList)) {
              const tests = await studentService.getPendingTests(coursesList);
              coursesData = { courses: coursesList, tests };
            }
          } catch (err) {
            console.error("Failed to fetch courses or tests", err);
          }
        }

        setDashboardData({ ...stats, ...coursesData });
      } catch (error) {
        console.error("Failed to fetch student dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user.email]); // Add dependency if needed, though empty array is safer for now if user doesn't change

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your progress...</div>;
  }

  const stats = {
    coursesEnrolled: dashboardData?.enrolledCourses || 0,
    coursesCompleted: dashboardData?.completedCourses || 0,
    averageProgress: dashboardData?.averageProgress || 0,
    totalHoursSpent: 0
  };

  const pendingTests = dashboardData?.tests || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-gray-900 mb-2">Welcome back, {user.name}!</h2>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm">Enrolled Courses</p>
          </div>
          <p className="text-gray-900 text-2xl font-bold">{stats.coursesEnrolled}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm">Completed</p>
          </div>
          <p className="text-gray-900 text-2xl font-bold">{stats.coursesCompleted}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm">Avg Progress</p>
          </div>
          <p className="text-gray-900 text-2xl font-bold">{stats.averageProgress}%</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-gray-600 text-sm">Hours Spent</p>
          </div>
          <p className="text-gray-900 text-2xl font-bold">{stats.totalHoursSpent}h</p>
        </div>
      </div>

      {/* Pending Tests Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Tests</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You have {pendingTests.length} test(s) pending</span>
            </div>
          </div>

          {pendingTests.length > 0 ? (
            <div className="space-y-4">
              {pendingTests.map((test: any) => (
                <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900">{test.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{test.courseName}</p>
                  </div>
                  <button onClick={() => onViewTest(test)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending tests.</p>
          )}
        </div>
      </div>

      {/* Note for User */}
      {/* Course List Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900">My Courses</h3>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'not-started', label: 'Not Started' }
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(status.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {!dashboardData?.courses || dashboardData.courses.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">You haven't been enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.courses
              .filter((course: any) => filterStatus === 'all' || course.status === filterStatus)
              .map((course: any) => (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="p-6 flex-1">

                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Template</p>
                      <p className="text-sm text-gray-900">{course.templateType || 'Standard'}</p>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{course.sectionsCompleted} of {course.totalSections} sections</span>
                        <span className="font-semibold text-gray-900">{course.progress}%</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{course.estimatedDuration ? `${course.estimatedDuration}` : 'Flexible timing'}</span>
                        {course.lastAccessed && <span>Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => onViewCourse(course)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${course.status === 'completed'
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {course.status === 'completed' ? 'Review' : 'Continue'}
                    </button>
                    <button
                      onClick={() => onViewCourse(course)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}
