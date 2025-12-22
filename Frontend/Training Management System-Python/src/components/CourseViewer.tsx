import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, Circle, Lock, PlayCircle } from 'lucide-react';
import { progressService } from '../services/progressService';
import { authService } from '../services/auth';
import { courseService } from '../services/courseService';
import { getYouTubeEmbedUrl } from '../utils/videoUtils';

interface CourseViewerProps {
  course: any;
  onBack: () => void;
  userRole: string;
}

export function CourseViewer({ course, onBack, userRole }: CourseViewerProps) {
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [actualProgress, setActualProgress] = useState(0);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log('Fetching course data for:', course.id);

        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          alert('Please log in to view course content');
          onBack();
          return;
        }

        // Fetch course with sections
        const data = await courseService.getCourseWithSections(course.id);
        console.log('Course data received:', data);

        setCourseData(data);

        // Fetch student progress for this course
        let progressData: any[] = [];
        try {
          progressData = await progressService.getStudentProgress(currentUser.id, course.id);
          console.log('Progress data received:', progressData);
        } catch (error) {
          console.error('Error fetching progress:', error);
          // Continue even if progress fetch fails
        }

        // Create a map of sectionId -> completed status
        const progressMap = new Map(
          progressData.map((p: any) => [p.sectionId, p.completed])
        );

        // Map sections to include completed status from student progress
        const mappedSections = (data.sections || []).map((section: any) => ({
          id: section.id,
          title: section.title,
          content: section.content || 'No content available',
          videoUrl: section.videoUrl,
          imageUrl: section.imageUrl,
          orderIndex: section.orderIndex,
          duration: section.duration,
          completed: progressMap.get(section.id) || false, // Get actual completion status
          locked: false
        }));

        console.log('Mapped sections with progress:', mappedSections);

        setSections(mappedSections);

        // Calculate actual progress percentage
        const completedCount = mappedSections.filter((s: any) => s.completed).length;
        const progressPercentage = mappedSections.length > 0
          ? Math.round((completedCount / mappedSections.length) * 100)
          : 0;
        setActualProgress(progressPercentage);
        console.log(`Progress: ${completedCount}/${mappedSections.length} = ${progressPercentage}%`);

        if (mappedSections.length > 0) {
          setSelectedSection(mappedSections[0]);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        alert('Failed to load course content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (course?.id) {
      fetchCourseData();
    }
  }, [course?.id, onBack]);

  const handleSectionComplete = async () => {
    setIsCompleting(true);
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        alert('Please log in to mark sections as complete');
        return;
      }

      console.log('Marking section complete:', {
        sectionId: selectedSection.id,
        studentId: currentUser.id,
        courseId: course.id,
        selectedSection,
        course
      });

      // Call the API to mark section as complete
      await progressService.completeSection(
        selectedSection.id.toString(),
        currentUser.id,
        course.id,
        0 // timeSpent - could be tracked with a timer
      );

      // Update local state to reflect completion
      setSections(prevSections => {
        const updatedSections = prevSections.map(section =>
          section.id === selectedSection.id
            ? { ...section, completed: true }
            : section
        );

        // Recalculate progress
        const completedCount = updatedSections.filter((s: any) => s.completed).length;
        const progressPercentage = updatedSections.length > 0
          ? Math.round((completedCount / updatedSections.length) * 100)
          : 0;
        setActualProgress(progressPercentage);

        return updatedSections;
      });

      // Update the selected section
      setSelectedSection((prev: any) => ({ ...prev, completed: true }));

      alert('Section marked as complete!');
    } catch (error: any) {
      console.error('Error marking section as complete:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || error.message
        || 'Failed to mark section as complete. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!selectedSection || sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No course content available.</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h2>
              <p className="text-gray-600">{course.description}</p>
            </div>
            {userRole !== 'admin' && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Your Progress</p>
                <p className="text-2xl font-bold text-gray-900">{actualProgress}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => !section.locked && setSelectedSection(section)}
                    disabled={section.locked}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSection.id === section.id
                      ? 'bg-blue-50 border border-blue-200'
                      : section.locked
                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {section.locked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : section.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 mb-1">
                          {index + 1}. {section.title}
                        </p>
                        {section.completed && (
                          <p className="text-xs text-green-600">Completed</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Progress Bar */}
              {userRole !== 'admin' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{actualProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${actualProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {sections.filter(s => s.completed).length} of {sections.length} sections completed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedSection.title}</h3>
                    <p className="text-blue-100 text-sm">
                      Section {sections.findIndex(s => s.id === selectedSection.id) + 1} of {sections.length}
                    </p>
                  </div>
                  {selectedSection.completed && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Player (for templates with video) */}
              {(courseData?.templateType === 'video-only' || courseData?.templateType === 'text-video') && selectedSection.videoUrl && (() => {
                const embedUrl = getYouTubeEmbedUrl(selectedSection.videoUrl);
                return (
                  <div className="relative bg-black aspect-video">
                    {embedUrl ? (
                      showVideo ? (
                        <iframe
                          src={`${embedUrl}?autoplay=1`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={selectedSection.title}
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <iframe
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={selectedSection.title}
                          />
                          <button
                            onClick={() => setShowVideo(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors group"
                          >
                            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <PlayCircle className="w-10 h-10 text-blue-600" />
                            </div>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-white text-lg">Invalid Video URL</p>
                        <p className="text-white text-sm mt-2">Please provide a valid YouTube link</p>
                        <p className="text-gray-400 text-xs mt-2">{selectedSection.videoUrl}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Text Content */}
              {selectedSection.content && (
                <div className="p-8">
                  <div className="prose max-w-none">
                    {selectedSection.content.split('\n').map((paragraph: any, index: any) => (
                      <p key={index} className="text-gray-700 mb-4 whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === selectedSection.id);
                      if (currentIndex > 0) {
                        setSelectedSection(sections[currentIndex - 1]);
                        setShowVideo(false);
                      }
                    }}
                    disabled={sections[0].id === selectedSection.id}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous Section
                  </button>

                  <div className="flex gap-3">
                    {!selectedSection.completed && userRole !== 'admin' && (
                      <button
                        onClick={handleSectionComplete}
                        disabled={isCompleting}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {isCompleting ? 'Marking...' : 'Mark as Complete'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === selectedSection.id);
                        if (currentIndex < sections.length - 1) {
                          setSelectedSection(sections[currentIndex + 1]);
                          setShowVideo(false);
                        }
                      }}
                      disabled={sections[sections.length - 1].id === selectedSection.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next Section
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
