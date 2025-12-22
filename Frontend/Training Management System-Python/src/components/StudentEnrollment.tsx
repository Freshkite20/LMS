import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Mail, Key, CheckCircle, Copy } from 'lucide-react';
import { studentService } from '../services/studentService';
import { batchService, Batch } from '../services/batchService';

interface StudentEnrollmentProps {
  onBack: () => void;
}

export function StudentEnrollment({ onBack }: StudentEnrollmentProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    batch: '',
    phone: ''
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data: any = await batchService.getAll();
        // Handle different potential response structures
        if (Array.isArray(data)) {
          setBatches(data);
        } else if (data.batches && Array.isArray(data.batches)) {
          setBatches(data.batches);
        } else if (data.data && Array.isArray(data.data)) { // Support generic paginated
          setBatches(data.data);
        }
      } catch (error) {
        console.error("Failed to load batches", error);
      }
    };
    fetchBatches();
  }, []);

  // Generate a temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await studentService.enrollStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        batch: formData.batch // This is now the batchId
      });

      // Backend returns temporaryPassword
      if (result.temporaryPassword) {
        setGeneratedPassword(result.temporaryPassword);
      } else {
        setGeneratedPassword("Sent to email"); // Fallback
      }

      setStep('success');
    } catch (error) {
      alert('Failed to enroll student. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleEnrollAnother = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      batch: '',
      phone: ''
    });
    setGeneratedPassword('');
    setStep('form');
  };

  if (step === 'success') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-gray-900 mb-2">Student Enrolled Successfully!</h2>
            <p className="text-gray-600">
              {formData.firstName} {formData.lastName} has been added to the system
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-gray-900 mb-4">Student Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Batch:</span>
                <span className="text-gray-900">{formData.batch}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Key className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Temporary Password Generated</h4>
                <p className="text-gray-600 text-sm mb-4">
                  This password has been generated via Keycloak and sent to the student's email.
                  The student will be required to change it on first login.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-3 rounded border border-gray-300 text-gray-900">
                    {generatedPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="p-3 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-gray-900 text-sm mb-1">Email Sent</h4>
                <p className="text-gray-600 text-sm">
                  Welcome email with login credentials has been sent to {formData.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleEnrollAnother}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Enroll Another Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h2 className="text-gray-900 mb-2">Enroll New Student</h2>
        <p className="text-gray-600">Add a new student to the training management system</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Login credentials will be sent to this email
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+91"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Assign to Batch</label>
            <select
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a batch</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-gray-900 text-sm mb-1">Keycloak Integration</h4>
                <p className="text-gray-600 text-sm">
                  Upon submission, a temporary password will be generated via Keycloak's API and sent
                  to the student's email. The student will be required to change the password on first login.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Enroll Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
