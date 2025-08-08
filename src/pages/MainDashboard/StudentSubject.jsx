import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../../api/axiosInstance';

function StudentSubject() {
  const [students, setStudents] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignSubjectsModal, setShowAssignSubjectsModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', fullname: '', department: '', yearLevel: '' });
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails")) || {};
        setCurrentRole(userDetails.role || '');

        const { data: allStudents } = await axiosInstance.get('/Auth/all-students');

        setStudents(  
          userDetails.role === 'Student'
            ? allStudents.filter(s => s.username === userDetails.userName)
            : allStudents
        );

const { data: subjectData } = await axiosInstance.get('/StudentSubjects');

        const map = subjectData.reduce((acc, s) => {
          acc[s.userId] = s.subjects.map(sub => ({
            ...sub,
            scores: {
              quiz: Math.floor(Math.random() * 21) + 80,
              exam: Math.floor(Math.random() * 21) + 75,
              project: Math.floor(Math.random() * 26) + 70,
              attendance: Math.floor(Math.random() * 11) + 90
            }
          }));
          return acc;
        }, {});
        setSubjectsMap(map);

const { data: availData } = await axiosInstance.get('/Subjects');

        setAvailableSubjects(availData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const toggleDetails = id => setExpandedUserId(prev => (prev === id ? null : id));

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async e => {
    e.preventDefault();
    try {
const res = await axiosInstance.post('/StudentSubjects', {
  studentId: selectedStudentId,
  subjectIds: selectedSubjectIds
});
      if (res.ok) {
        toast.success('Student added successfully!');
        setShowAddStudentModal(false);
        setFormData({ username: '', password: '', fullname: '', department: '', yearLevel: '' });
        // Refresh data
  const { data: allStudents } = await axiosInstance.get('/Auth/all-students');
  setStudents(allStudents);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Error adding student.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleDeleteStudent = async id => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
const res = await axiosInstance.delete(`/Auth/delete-user/${id}`);

      if (res.ok) {
        toast.success('Student deleted successfully.');
const { data: allStudents } = await axiosInstance.get('/Auth/all-students');
setStudents(allStudents);

      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to delete student.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleAssignSubjects = async e => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error('Please select a student.');
    if (!selectedSubjectIds.length) return toast.error('Please select at least one subject.');

    try {
const res = await axiosInstance.post('/StudentSubjects', {
  studentId: selectedStudentId,
  subjectIds: selectedSubjectIds
});

      if (res.ok) {
        toast.success('Subjects assigned successfully!');
        setShowAssignSubjectsModal(false);
        // Refresh data
const { data: subjectData } = await axiosInstance.get('/StudentSubjects');
        const map = subjectData.reduce((acc, s) => {
          acc[s.userId] = s.subjects.map(sub => ({
            ...sub,
            scores: {
              quiz: Math.floor(Math.random() * 21) + 80,
              exam: Math.floor(Math.random() * 21) + 75,
              project: Math.floor(Math.random() * 26) + 70,
              attendance: Math.floor(Math.random() * 11) + 90
            }
          }));
          return acc;
        }, {});
        setSubjectsMap(map);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to assign subjects.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <div style={{ height: 'auto' }}>
      <div style={{ marginTop: '50px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h4><b>Students</b></h4>
        {currentRole !== 'Student' && (
          <>
            {/* <button className="btn btn-success" onClick={() => setShowAddStudentModal(true)}>Add Student</button> */}
            <button className="btn btn-success" onClick={() => setShowAddStudentModal(false)}>Add Student</button>
            {/* <button className="btn btn-info" onClick={() => setShowAssignSubjectsModal(true)}>Assign Subjects</button> */}
            <button className="btn btn-info" onClick={() => setShowAssignSubjectsModal(false)}>Assign Subjects</button>
          </>
        )}
      </div>
      <table className="table table-bordered table-hover mt-3">
        <thead className="table-light">
          <tr>
            <th>Full Name</th>
            <th>Department</th>
            <th>Year Level</th>
            <th style={{ width: '200px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <React.Fragment key={student.id}>
              <tr>
                <td>{student.fullname}</td>
                <td>{student.department || '-'}</td>
                <td>{student.yearLevel || '-'}</td>
                <td>
                  {currentRole !== 'Student' && (
                    <button className="btn btn-sm btn-danger">Delete</button>
                    // <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStudent(student.id)}>Delete</button>

                  )}
                  {subjectsMap[student.id] ? (
                    <button className="btn btn-sm btn-primary ms-2" onClick={() => toggleDetails(student.id)}>
                      {expandedUserId === student.id ? 'Hide Subjects' : 'View Subjects'}
                    </button>
                  ) : (
                    <span className="text-muted">No subjects</span>
                  )}
                </td>
              </tr>
              {expandedUserId === student.id && subjectsMap[student.id] && (
                <tr>
                  <td colSpan="4" className="bg-light">
                    <h5>Subjects</h5>
                    <ul className="list-group list-group-flush">
                      {subjectsMap[student.id].map(subject => (
                        <li key={subject.subjectId} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>{subject.subjectName}</strong> ({subject.subjectCode}) — Taught by {subject.teacherName}
                          </div>
                          <table className="table table-sm table-bordered w-auto mt-2 mb-0">
                            <thead className="table-light">
                              <tr><th>Quiz</th><th>Exam</th><th>Project</th><th>Attendance</th><th>Average</th></tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>{subject.scores.quiz}</td>
                                <td>{subject.scores.exam}</td>
                                <td>{subject.scores.project}</td>
                                <td>{subject.scores.attendance}</td>
                                <td>{Math.round((subject.scores.quiz + subject.scores.exam + subject.scores.project + subject.scores.attendance) / 4)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <form onSubmit={handleAddStudent}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Student</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddStudentModal(false)} aria-label="Close" />
                </div>
                <div className="modal-body">
                  {['username', 'password', 'fullname'].map(f => (
                    <div className="mb-3" key={f}>
                      <label className="form-label text-capitalize">{f}</label>
                      <input type={f === 'password' ? 'password' : 'text'} className="form-control" name={f} value={formData[f]} onChange={handleInputChange} required />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <div className="btn-group d-flex flex-wrap gap-2">
                      {['BSBA', 'BSIT', 'BSA', 'BSED'].map(dept => (
                        <button type="button" key={dept} className={`btn ${formData.department === dept ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`} onClick={() => setFormData(prev => ({ ...prev, department: dept }))}>
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Year Level</label>
                    <div className="btn-group d-flex flex-wrap gap-2">
                      {['1st year', '2nd year', '3rd year', '4th year'].map(year => (
                        <button type="button" key={year} className={`btn ${formData.yearLevel === year ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`} onClick={() => setFormData(prev => ({ ...prev, yearLevel: year }))}>
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Add Student</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subjects Modal */}
      {showAssignSubjectsModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <form onSubmit={handleAssignSubjects}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Subjects to Student</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssignSubjectsModal(false)} aria-label="Close" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Student</label>
                    <select className="form-select" value={selectedStudentId || ''} onChange={e => setSelectedStudentId(Number(e.target.value))} required>
                      <option value="" disabled>Select a student</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.fullname}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Select Subjects</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {availableSubjects.map(sub => (
                        <div key={sub.id} className="form-check">
                          <input className="form-check-input" type="checkbox" id={`sub-${sub.id}`} checked={selectedSubjectIds.includes(sub.id)} onChange={() => {
                            setSelectedSubjectIds(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]);
                          }} />
                          <label className="form-check-label" htmlFor={`sub-${sub.id}`}>{sub.subjectName} ({sub.subjectCode})</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Assign Subjects</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssignSubjectsModal(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default StudentSubject;
