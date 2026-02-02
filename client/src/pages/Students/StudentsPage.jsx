/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Students Page
 * Manage students - view list and add new students
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

export default function StudentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', rollNo: '' });
  const [formError, setFormError] = useState('');

  /**
   * Load students on mount
   */
  useEffect(() => {
    loadStudents();
  }, []);

  /**
   * Fetch all students
   */
  const loadStudents = async () => {
    console.log('[STUDENTS] Loading students');
    setIsLoading(true);
    setError('');

    try {
      const response = await studentsAPI.getAll();
      console.log('[STUDENTS] Loaded:', response.count, 'students');
      setStudents(response.students || []);
    } catch (err) {
      console.error('[STUDENTS] Failed to load:', err);
      setError('Failed to load students.');
    }

    setIsLoading(false);
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError('');
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    console.log('[STUDENTS] Adding student:', formData);

    try {
      const response = await studentsAPI.create(formData);
      
      if (response.success) {
        console.log('[STUDENTS] Student added successfully');
        setSuccess('Student added successfully!');
        setIsModalOpen(false);
        setFormData({ name: '', rollNo: '' });
        loadStudents();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('[STUDENTS] Failed to add:', err);
      setFormError(err.response?.data?.message || 'Failed to add student');
    }

    setIsSubmitting(false);
  };

  /**
   * Filter students by search term
   */
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading students..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={styles.header}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Student
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Empty State */}
      {students.length === 0 ? (
        <div className="glass-card-static" style={{ padding: '2rem' }}>
          <EmptyState
            icon="◎"
            title="No students yet"
            message="Add students to start tracking their attendance"
            action={() => setIsModalOpen(true)}
            actionLabel="Add Your First Student"
          />
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="glass-card-static" style={styles.searchCard}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Students Table */}
          <div className="glass-card-static" style={styles.tableCard}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Roll No</th>
                    <th>Name</th>
                    <th style={{ width: '180px' }}>Added On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                        No students match your search
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr key={student._id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                        <td>
                          <span className="badge badge-primary">{student.rollNo}</span>
                        </td>
                        <td>
                          <div style={styles.studentName}>
                            <div style={styles.avatar}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#6B7280' }}>
                          {new Date(student.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Student"
        footer={
          <>
            <button 
              className="btn btn-ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <Alert type="error" message={formError} />}
          
          <div className="form-group">
            <label className="form-label">Student Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={handleInputChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Roll Number</label>
            <input
              type="text"
              name="rollNo"
              className="form-input"
              placeholder="e.g., A001, 2024001"
              value={formData.rollNo}
              onChange={handleInputChange}
              required
              minLength={1}
            />
            <small style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Roll numbers must be unique
            </small>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchCard: {
    padding: '1rem',
    marginBottom: '1rem',
  },
  tableCard: {
    padding: '0.5rem',
  },
  studentName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #DBFCFF 0%, #A8E8EF 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#09416D',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};
