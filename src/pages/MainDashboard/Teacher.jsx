import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../../api/axiosInstance';
import loginService from '../../../api/loginService';

function Teacher() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loggedInUsername, setLoggedInUsername] = useState('');
  const [formData, setFormData] = useState({
    fullname: '',
    userId: null,
    username: '',
    password: '',
    subjectIds: []
  });

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const userDetails = loginService.getUserDetails();
    if (userDetails) {
      setUserRole(userDetails.role);
      setLoggedInUsername(userDetails.userName || userDetails.username);
      loadSubjects();

      if (userDetails.role === 'Teacher') {
        loadTeacherById(userDetails.id);
      } else if (userDetails.role === 'Admin') {
        loadAllTeachers();
      }
    }
  }, []);

  useEffect(() => {
    if (userRole && loggedInUsername) {
      loadAllTeachers();
    }
  }, [userRole, loggedInUsername]);

  const loadSubjects = async () => {
    const res = await axiosInstance.get('/Subjects');
    setSubjects(res.data);
  };

  const loadTeacherById = async (teacherId) => {
    try {
      const res = await axiosInstance.get(`/Teachers/${teacherId}`);
      setTeachers([res.data]); // wrap in array so table rendering is consistent
    } catch (error) {
      toast.error("Failed to load your teacher details.");
      console.error(error);
    }
  };

  const loadAllTeachers = async () => {
    try {
      const res = await axiosInstance.get('/Teachers');
      setTeachers(res.data);
    } catch (error) {
      toast.error("Failed to load teachers.");
      console.error(error);
    }
  };

    const toggleSubjects = (id) => {
    setExpandedTeacherId(prev => (prev === id ? null : id));
  };

  const openModal = (teacher = null) => {
    if (teacher) {
      setEditing(teacher);
      setFormData({
        fullname: teacher.fullname,
        userId: teacher.userId,
        username: teacher.username,
        password: '',
        subjectIds: teacher.subjects.map(s => s.id).filter(id => typeof id === 'number')
      });
    } else {
      setEditing(null);
      setFormData({ fullname: '', userId: null, username: '', password: '', subjectIds: [] });
    }
    setShowModal(true);
  };

  const handleCheckboxChange = (id) => {
    setFormData(prev => {
      const ids = prev.subjectIds.includes(id)
        ? prev.subjectIds.filter(x => x !== id)
        : [...prev.subjectIds, id];
      return { ...prev, subjectIds: ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedSubjectIds = formData.subjectIds.filter(id => typeof id === 'number');

    const payload = editing
      ? {
          fullname: formData.fullname,
          userId: formData.userId,
          subjectIds: cleanedSubjectIds
        }
      : {
          fullname: formData.fullname,
          username: formData.username,
          password: formData.password,
          subjectIds: cleanedSubjectIds
        };

    try {
      if (editing) {
        await axiosInstance.put(`/Teachers/${editing.id}`, payload);
      } else {
        await axiosInstance.post(`/Teachers/create-teacher-with-subjects`, payload);
      }

      toast.success(`Teacher ${editing ? 'updated' : 'created'} successfully!`);
      setShowModal(false);
      loadAllTeachers();

    } catch (error) {
      console.error("Submission error:", error);

      const message =
        error.response?.data?.message ||
        `Failed to ${editing ? 'update' : 'create'} teacher.`;

      toast.error(message);
    }
  };
  const confirmDelete = (id) => {
    toast.info(() => (
      <div>
        Are you sure you want to delete this teacher?
        <div className="mt-2">
          <button
            className="btn btn-sm btn-danger me-2"
            onClick={async () => {
              try {
                await axiosInstance.delete(`/Teachers/${id}`);
                toast.dismiss();
                toast.success('Teacher deleted.');
                loadAllTeachers();
              } catch (err) {
                toast.dismiss();
                toast.error('Failed to delete.');
                console.error(err);
              }
            }}
          >
            Yes, delete
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss()}>
            Cancel
          </button>
        </div>
      </div>
    ), { autoClose: false, closeOnClick: false, draggable: false, closeButton: false });
  };

  // Filter, Sort, and Paginate
  const filteredTeachers = teachers
    .filter(t => t.fullname.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const nameA = a.fullname.toLowerCase();
      const nameB = b.fullname.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const displayedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    itemsPerPage === 'All' ? filteredTeachers.length : currentPage * itemsPerPage
  );

  // 🔒 Prevent rendering for Teacher or User roles
  if (userRole === 'Teacher' || userRole === 'User') {
    return null; // Or return <p>Access denied.</p>
  }

  return (
    <div>
      {userRole !== 'Teacher' && (
        <button className="btn btn-success mb-3" onClick={() => openModal()}>
          Add Teacher
        </button>
      )}

      <div className="row mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search by Full Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={itemsPerPage}
            onChange={e => {
              const value = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 'All'].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="table table-bordered table-hover">
        <thead className="table-light">
          <tr>
            <th onClick={() => setSortAsc(prev => !prev)} style={{ cursor: 'pointer' }}>
              Full Name {sortAsc ? '▲' : '▼'}
            </th>
            <th style={{ width: '350px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedTeachers.map(teacher => (
            <React.Fragment key={teacher.id}>
              <tr>
                <td>{teacher.fullname}</td>
                <td>
                  {(userRole !== 'Teacher' || teacher.username === loggedInUsername) && (
                    <>
                      <button className="btn btn-sm btn-primary me-2" onClick={() => openModal(teacher)}>Edit</button>
                      <button className="btn btn-sm btn-danger me-2" onClick={() => confirmDelete(teacher.id)}>Delete</button>
                    </>
                  )}
                  <button className="btn btn-sm btn-info" onClick={() => toggleSubjects(teacher.id)}>
                    {expandedTeacherId === teacher.id ? 'Hide' : 'View'} Subjects
                  </button>
                </td>
              </tr>
              {expandedTeacherId === teacher.id && (
                <tr>
                  <td colSpan="2" className="bg-light">
                    <h5>Subjects</h5>
                    {teacher.subjects?.length ? (
                      <ul>
                        {teacher.subjects.map(s => (
                          <li key={s.subjectCode}>
                            <strong>{s.subjectName}</strong> ({s.subjectCode}) - {s.credits} credits<br />
                            <small>{s.description}</small>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-muted">No subjects assigned.</p>}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="btn btn-secondary"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit Teacher' : 'Add Teacher'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Fullname</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.fullname}
                    onChange={e => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
                    required
                  />
                </div>

                {!editing && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label">Assign Subjects</label>
                  <div className="d-flex flex-wrap gap-2">
                    {subjects.map(s => (
                      <div key={s.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`sub_${s.id}`}
                          checked={formData.subjectIds.includes(s.id)}
                          onChange={() => handleCheckboxChange(s.id)}
                        />
                        <label className="form-check-label" htmlFor={`sub_${s.id}`}>
                          {s.subjectName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default Teacher;
