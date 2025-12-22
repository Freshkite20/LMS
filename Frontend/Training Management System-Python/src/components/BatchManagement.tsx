import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, X, Search } from 'lucide-react';
import { batchService, Batch } from '../services/batchService';
import { studentService, Student } from '../services/studentService';

interface BatchManagementProps {
  onBack: () => void;
}

export function BatchManagement({ onBack }: BatchManagementProps) {
  const [view, setView] = useState<'list' | 'create' | 'assign'>('list');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesData, studentsData] = await Promise.all([
        batchService.getAll(),
        studentService.getAll()
      ]);
      setBatches(batchesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await batchService.create({
        name: newBatchName,
        startDate: newBatchStartDate
      });
      alert(`Batch "${newBatchName}" created successfully!`);
      setNewBatchName('');
      setNewBatchStartDate('');
      setView('list');
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert('Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedBatch) return;
    try {
      setIsSubmitting(true);
      await batchService.assignStudents(selectedBatch, selectedStudents);
      alert(`${selectedStudents.length} student(s) assigned to batch`);
      setSelectedStudents([]);
      setView('list');
      fetchData(); // Refresh counts
    } catch (error) {
      console.error('Failed to assign students:', error);
      alert('Failed to assign students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-2">Batch Management</h2>
            <p className="text-gray-600">Create and manage student batches</p>
          </div>
          {view === 'list' && (
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus className="w-5 h-5" />
              Create Batch
            </button>
          )}
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-900 mb-1">{batch.name}</h3>
                  <p className="text-gray-500 text-sm">Batch ID: {batch.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBatch(batch.id);
                    setView('assign');
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  Assign Students
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Students</p>
                  <p className="text-gray-900">{batch.students}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                  <p className="text-gray-900">{batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Students enrolled in this batch</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch View */}
      {view === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-gray-900 mb-6">Create New Batch</h3>
          <form onSubmit={handleCreateBatch} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Batch Name</label>
              <input
                type="text"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Web Development Q2 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={newBatchStartDate}
                onChange={(e) => setNewBatchStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                After creating the batch, you can assign students to it from the batch list.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setView('list')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Students View */}
      {view === 'assign' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h3 className="text-gray-900 mb-2">Assign Students to Batch</h3>
            <p className="text-gray-600 text-sm">
              Selected Batch: {batches.find(b => b.id === selectedBatch)?.name}
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search students..."
              />
            </div>
          </div>

          {/* Student Selection */}
          <div className="mb-6">
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudentSelection(student.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">{student.name}</p>
                    <p className="text-gray-500 text-xs">{student.email}</p>
                  </div>
                  {student.batch && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      Current: {student.batch}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              {selectedStudents.length} student(s) selected for assignment
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setView('list');
                setSelectedStudents([]);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignStudents}
              disabled={selectedStudents.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
            >
              Assign {selectedStudents.length} Student(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
