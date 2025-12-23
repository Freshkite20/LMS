import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Send, CheckCircle } from 'lucide-react';
import { courseService, Course } from '../services/courseService';
import { batchService, Batch } from '../services/batchService';
import { studentService, Student } from '../services/studentService';

interface CourseAssignmentProps {
  onBack: () => void;
}

export function CourseAssignment({ onBack }: CourseAssignmentProps) {
  const [step, setStep] = useState<'course' | 'target' | 'confirm'>('course');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'batch' | 'individual'>('batch');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesData, batchesData, studentsData] = await Promise.all([
          courseService.getAll(),
          batchService.getAll(),
          studentService.getAll()
        ]);
        setCourses(coursesData);
        setBatches(batchesData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setStep('target');
  };

  const toggleTargetSelection = (targetId: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const handleAssign = async () => {
    if (!selectedCourse) return;
    setIsAssigning(true);

    try {
      const payload: any = {
        assignmentType
      };

      if (assignmentType === 'individual') {
        payload.studentIds = selectedTargets;
      } else {
        payload.batchIds = selectedTargets;
      }

      await courseService.assign(selectedCourse, payload);

      setIsAssigning(false);
      setShowSuccess(true);

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Failed to assign course:', error);
      alert('Failed to assign course');
      setIsAssigning(false);
    }
  };

  const targets = assignmentType === 'batch' ? batches : students;
  const filteredTargets = targets.filter((t: any) =>
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Course Assigned Successfully!</h2>
          <p className="text-gray-600">
            {courses.find(c => c.id === selectedCourse)?.title} has been assigned to{' '}
            {selectedTargets.length} {assignmentType === 'batch' ? 'batch(es)' : 'student(s)'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h2 className="text-gray-900 mb-2">Assign Course</h2>
        <p className="text-gray-600">Assign courses to students or batches</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {['Select Course', 'Choose Target', 'Confirm'].map((label, index) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(step === 'course' && index === 0) ||
                  (step === 'target' && index === 1) ||
                  (step === 'confirm' && index === 2)
                  ? 'bg-blue-600 text-white'
                  : index < ['course', 'target', 'confirm'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}>
                  {index + 1}
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              {index < 2 && <div className="w-12 h-0.5 bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Course */}
      {step === 'course' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-900 mb-4">Select a Course</h3>
          <div className="space-y-3">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => handleCourseSelect(course.id)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-gray-900 mb-1">{course.title}</h4>
                    <p className="text-gray-500 text-sm">{course.category}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Target */}
      {step === 'target' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-4">
              Assign "{courses.find(c => c.id === selectedCourse)?.title}"
            </h3>

            {/* Assignment Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setAssignmentType('batch');
                  setSelectedTargets([]);
                }}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${assignmentType === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Assign to Batch
              </button>
              <button
                onClick={() => {
                  setAssignmentType('individual');
                  setSelectedTargets([]);
                }}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${assignmentType === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Assign to Individual
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Search ${assignmentType === 'batch' ? 'batches' : 'students'}...`}
              />
            </div>
          </div>

          {/* Target Selection */}
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto mb-6">
            {filteredTargets.map((target: any) => (
              <label
                key={target.id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTargets.includes(target.id)}
                  onChange={() => toggleTargetSelection(target.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{target.name}</p>
                  {assignmentType === 'batch' ? (
                    <p className="text-gray-500 text-xs">{target.students} students</p>
                  ) : (
                    <p className="text-gray-500 text-xs">{target.email}</p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('course')}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={selectedTargets.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
            >
              Next: Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-900 mb-6">Confirm Assignment</h3>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Course</p>
              <p className="text-gray-900">
                {courses.find(c => c.id === selectedCourse)?.title}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">
                Will be assigned to {selectedTargets.length} {assignmentType === 'batch' ? 'batch(es)' : 'student(s)'}:
              </p>
              <ul className="space-y-1">
                {selectedTargets.map(id => {
                  const target = targets.find((t: any) => t.id === id);
                  return (
                    <li key={id} className="text-gray-900 text-sm">
                      • {(target as any)?.name}
                    </li>
                  );
                })}
              </ul>
            </div>

            {assignmentType === 'batch' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  Total students affected: {selectedTargets.reduce((sum, id) => {
                    const batch = batches.find(b => b.id === id);
                    return sum + (batch?.students || 0);
                  }, 0)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('target')}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {isAssigning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Confirm & Assign
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
