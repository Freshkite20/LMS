import { useState } from 'react';
import { ArrowLeft, Eye, Send, CheckCircle } from 'lucide-react';

interface CoursePreviewProps {
  onBack: () => void;
}

// Mock course data for preview
const mockPreviewCourse = {
  id: 'C004',
  title: 'Database Design',
  description: 'Learn fundamental database design principles and best practices',
  template: 'Text only',
  sections: [
    {
      id: 1,
      title: 'Introduction to Databases',
      content: 'A database is an organized collection of structured information, or data, typically stored electronically in a computer system...'
    },
    {
      id: 2,
      title: 'Data Modeling',
      content: 'Data modeling is the process of creating a data model for the data to be stored in a database...'
    },
    {
      id: 3,
      title: 'Normalization',
      content: 'Database normalization is the process of structuring a relational database in accordance with a series of normal forms...'
    }
  ]
};

export function CoursePreview({ onBack }: CoursePreviewProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Simulate publishing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would:
    // 1. Validate all course content
    // 2. Save to database with published status
    // 3. Make available to students
    // 4. Send notifications
    
    setIsPublishing(false);
    setPublished(true);
    
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  if (published) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Course Published Successfully!</h2>
          <p className="text-gray-600">
            {mockPreviewCourse.title} is now available to students
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course Creation
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-2">Course Preview</h2>
            <p className="text-gray-600">Review your course before publishing</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg"
          >
            {isPublishing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publish Course
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-gray-900 mb-4">Sections</h3>
            <nav className="space-y-2">
              {mockPreviewCourse.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSection === index
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm text-gray-900">
                    {index + 1}. {section.title}
                  </p>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {/* Course Header */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mockPreviewCourse.title}
              </h1>
              <p className="text-gray-600 mb-4">{mockPreviewCourse.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                  {mockPreviewCourse.template}
                </span>
                <span className="text-gray-500">
                  {mockPreviewCourse.sections.length} sections
                </span>
              </div>
            </div>

            {/* Current Section */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {mockPreviewCourse.sections[currentSection].title}
              </h3>
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  {mockPreviewCourse.sections[currentSection].content}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Section {currentSection + 1} of {mockPreviewCourse.sections.length}
              </span>
              <button
                onClick={() => setCurrentSection(Math.min(mockPreviewCourse.sections.length - 1, currentSection + 1))}
                disabled={currentSection === mockPreviewCourse.sections.length - 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-gray-900 text-sm mb-1">Preview Mode</h4>
            <p className="text-gray-700 text-sm">
              You are viewing a preview of your course. Click "Publish Course" when you're ready to make it available to students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
