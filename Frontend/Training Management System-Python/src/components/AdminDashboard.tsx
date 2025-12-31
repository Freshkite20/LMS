import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Layers,
  UserPlus,
  Key,
  PlusCircle,
  Upload,
  Send,
  TrendingUp,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { adminService, DashboardStats } from '../services/adminService';
import { batchService, Batch } from '../services/batchService';
import { courseService, Course } from '../services/courseService';
import { studentService, Student } from '../services/studentService';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onViewCourse: (course: any) => void;
}

export function AdminDashboard({ onNavigate, onViewCourse }: AdminDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'batches' | 'courses' | 'students'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, batchesData, coursesData, studentsData] = await Promise.all([
        adminService.getDashboardStats(),
        batchService.getAll(),
        courseService.getAll(),
        studentService.getAll()

      ]);
      console.log('Dashboard data fetched:', { statsData, batchesData, coursesData, studentsData });
      console.log('!!! BATCHES DATA IN DASHBOARD:', batchesData);
      console.log('!!! COURSES DATA IN DASHBOARD:', coursesData);
      console.log('!!! STUDENTS DATA IN DASHBOARD:', studentsData);
      setStats(statsData);
      setBatches(batchesData);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Add Student',
      description: 'Enroll new student',
      color: 'bg-blue-500',
      action: () => onNavigate('student-enrollment')
    },
    {
      icon: Key,
      label: 'Generate Password',
      description: 'Create temp password',
      color: 'bg-purple-500',
      action: () => onNavigate('student-enrollment')
    },
    {
      icon: PlusCircle,
      label: 'New Course',
      description: 'Create new course',
      color: 'bg-green-500',
      action: () => onNavigate('course-creation')
    },
    {
      icon: Upload,
      label: 'Upload Tests',
      description: 'Add test questions',
      color: 'bg-orange-500',
      action: () => onNavigate('test-upload')
    },
    {
      icon: Layers,
      label: 'Batch Management',
      description: 'Manage batches',
      color: 'bg-indigo-500',
      action: () => onNavigate('batch-management')
    },
    {
      icon: Send,
      label: 'Assign Course',
      description: 'Assign to students',
      color: 'bg-teal-500',
      action: () => onNavigate('course-assignment')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      {/* Page Header */}
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage your training programs, students, and track progress</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData()}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedTab('batches')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-gray-600 mb-1">Total Batches</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : (
              <>
                <span className="text-gray-900">{stats?.totalBatches || 0}</span>
                <span className="text-green-600 text-sm">+2 this month</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedTab('students')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-gray-600 mb-1">Total Students</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : (
              <>
                <span className="text-gray-900">{stats?.totalStudents || 0}</span>
                <span className="text-green-600 text-sm">+12 this month</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedTab('courses')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-gray-600 mb-1">Total Courses</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : (
              <>
                <span className="text-gray-900">{stats?.totalCourses || 0}</span>
                <span className="text-blue-600 text-sm">{stats?.activeCourses || 0} active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={action.action}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5 text-left"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-900 text-sm mb-1">{action.label}</p>
              <p className="text-gray-500 text-xs">{action.description}</p>

            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {(['overview', 'batches', 'courses', 'students'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`pb-3 border-b-2 transition-colors capitalize ${selectedTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Batches */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Recent Batches</h3>
              <button
                type="button"
                onClick={() => setSelectedTab('batches')}
                className="text-blue-600 text-sm hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {batches.length === 0 && !loading ? (
                <p className="text-gray-500 text-sm text-center py-4">No batches found</p>
              ) : (
                batches.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">{batch.name}</p>
                      <p className="text-gray-500 text-xs">{batch.students} students • {batch.courses} courses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{batch.progress}%</p>
                      <p className="text-xs text-gray-500">progress</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Recent Students</h3>
              <button
                type="button"
                onClick={() => setSelectedTab('students')}
                className="text-blue-600 text-sm hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {students.length === 0 && !loading ? (
                <p className="text-gray-500 text-sm text-center py-4">No students found</p>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm truncate">{student.name}</p>
                      <p className="text-gray-500 text-xs truncate">{student.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded">{student.batch}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'batches' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Batch Management</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('batch-management')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Batch
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {batches.length === 0 && !loading ? (
              <div className="p-6 text-center text-gray-500">No batches found</div>
            ) : (
              batches.map((batch) => (
                <div key={batch.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-gray-900 mb-1">{batch.name}</h4>
                      <p className="text-gray-500 text-sm">{batch.id}</p>
                    </div>
                    <button type="button" className="text-blue-600 hover:text-blue-700">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Students</p>
                      <p className="text-gray-900">{batch.students}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Courses</p>
                      <p className="text-gray-900">{batch.courses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg Progress</p>
                      <p className="text-gray-900">{batch.progress}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${batch.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTab === 'courses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Course Management</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('course-creation')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {courses.length === 0 && !loading ? (
              <div className="p-6 text-center text-gray-500">No courses found</div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-gray-900">{course.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${course.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {course.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">Template: {course.template}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewCourse(course)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Preview
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Enrolled Students</p>
                      <p className="text-gray-900">{course.enrolled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Average Progress</p>
                      <p className="text-gray-900">{course.avgProgress}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Student Management</h3>
              <button
                type="button"
                onClick={() => onNavigate('student-enrollment')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enroll Student
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Batch</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {student.batch}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(student.enrolled).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
