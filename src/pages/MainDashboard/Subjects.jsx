import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../../api/axiosInstance';

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    description: '',
    credits: '',
    teacherId: ''
  });

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadSubjects();
    loadTeachers();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const res = await axiosInstance.get('/Subjects');
    setSubjects(res.data);
    setLoading(false);
  };

  const loadTeachers = async () => {
    try {
      const res = await axiosInstance.get('/Teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Error loading teachers:', err);
      toast.error('Failed to load teachers.');
    }
  };

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        description: subject.description || '',
        credits: subject.credits,
        teacherId: teachers.find(t => t.fullname === subject.teacherName)?.id || ''
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        description: '',
        credits: '',
        teacherId: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      subjectCode: formData.subjectCode,
      subjectName: formData.subjectName,
      description: formData.description,
      credits: Number(formData.credits),
      teacherId: Number(formData.teacherId)
    };

    const msg = editingSubject ? 'updated' : 'created';

    try {
      if (editingSubject) {
        // Update existing subject
        await axiosInstance.put(`/Subjects/${editingSubject.id}`, payload);
      } else {
        // Create new subject
        await axiosInstance.post('/Subjects', payload);
      }

      toast.success(`Subject ${msg} successfully!`);
      setShowModal(false);
      loadSubjects();

    } catch (error) {
      console.error(`Error during subject ${msg}:`, error);

      const errMsg =
        error.response?.data?.message ||
        `Failed to ${msg} subject.`;

      toast.error(errMsg);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this subject?');
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/Subjects/${id}`);
      toast.success('Subject deleted successfully!');
      loadSubjects();
    } catch (error) {
      toast.error('Failed to delete subject.', error);
    }
  };

  // Filter, Sort, and Paginate
  const filteredSubjects = subjects
    .filter(sub => sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const nameA = a.subjectName.toLowerCase();
      const nameB = b.subjectName.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const displayedSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    itemsPerPage === 'All' ? filteredSubjects.length : currentPage * itemsPerPage
  );
  return (
    <div>
      <button className="btn btn-success mb-3" onClick={() => openModal()}>
        Add Subject
      </button>

      <div className="row mb-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search by Subject Name..."
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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Code</th>
              <th onClick={() => setSortAsc(prev => !prev)} style={{ cursor: 'pointer' }}>
                Name {sortAsc ? '▲' : '▼'}
              </th>
              <th>Description</th>
              <th>Credits</th>
              <th>Teacher</th>
              <th style={{ width: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSubjects.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.subjectCode}</td>
                <td>{sub.subjectName}</td>
                <td>{sub.description || "—"}</td>
                <td>{sub.credits}</td>
                <td>{sub.teacherName}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => openModal(sub)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sub.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
            <form onSubmit={handleSubmit}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingSubject ? "Edit Subject" : "Add Subject"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  {["subjectCode", "subjectName", "description", "credits"].map(field => (
                    <div className="mb-3" key={field}>
                      <label className="form-label text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type={field === "credits" ? "number" : "text"}
                        className="form-control"
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                        required={field !== "description"}
                      />
                    </div>
                  ))}
                     
                  {/* Teacher Dropdown */}
                  <div className="mb-3">
                    <label className="form-label">Assign Teacher</label>
                    <select
                      className="form-select"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a teacher...</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.fullname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    {editingSubject ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default Subjects;
