import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../../api/axiosInstance";
import loginService from "../../../api/loginService";
import { Card } from "antd";

function StudentSubject() {
  const [students, setStudents] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignSubjectsModal, setShowAssignSubjectsModal] = useState(false);

  const [formData, setFormData] = useState({
    studentNumber: "",
    username: "",
    password: "",
    fullname: "",
    department: "",
    yearLevel: "",
  });

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [sortField, setSortField] = useState("fullname");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch students, subjects, and grades
  const fetchStudentsAndSubjects = async () => {
    setLoading(true);
    try {
      const userDetails = loginService.getUserDetails();
      setCurrentRole(userDetails.role || "");

      const { data: allStudents } = await axiosInstance.get("/Auth/all-students");
      const filteredStudents =
        userDetails.role === "Student"
          ? allStudents.filter((s) => s.username === userDetails.userName)
          : allStudents;
      setStudents(filteredStudents);

      const { data: studentSubjectsData } = await axiosInstance.get("/StudentSubjects");

      const map = studentSubjectsData.reduce((acc, s) => {
        acc[s.userId] = s.subjects || [];
        return acc;
      }, {});
      setSubjectsMap(map);

      const { data: availData } = await axiosInstance.get("/Subjects");
      setAvailableSubjects(availData);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load student or subject data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndSubjects();
  }, []);

  const confirmDelete = (id) => {
    toast.info(
      () => (
        <div>
          Are you sure you want to delete this student?
          <div className="mt-2">
            <button
              className="btn btn-sm btn-danger me-2"
              onClick={async () => {
                try {
                  await axiosInstance.delete(`/Auth/delete-user/${id}`);
                  toast.dismiss();
                  toast.success("Student deleted successfully.");
                  fetchStudentsAndSubjects();
                } catch (err) {
                  toast.dismiss();
                  toast.error("Failed to delete student.");
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
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/Auth/create-student", {
        ...formData,
        role: "Student",
      });
      toast.success("Student added successfully!");
      setShowAddStudentModal(false);
      setFormData({
        studentNumber: "",
        username: "",
        password: "",
        fullname: "",
        department: "",
        yearLevel: "",
      });
      fetchStudentsAndSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error adding student.");
    }
  };

  const handleAssignSubjects = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error("Please select a student.");
    if (!selectedSubjectIds.length)
      return toast.error("Please select at least one subject.");

    try {
      await axiosInstance.post("/StudentSubjects", {
        studentId: selectedStudentId,
        subjectIds: selectedSubjectIds,
      });
      toast.success("Subjects assigned successfully!");
      setShowAssignSubjectsModal(false);
      setSelectedStudentId(null);
      setSelectedSubjectIds([]);
      fetchStudentsAndSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An unexpected error occurred.");
    }
  };

  // ✅ Filtering (by name or year level)
  const filteredStudents = students
    .filter(
      (s) =>
        s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.yearLevel?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === "fullname")
        return sortAsc
          ? a.fullname.localeCompare(b.fullname)
          : b.fullname.localeCompare(a.fullname);
      if (sortField === "yearLevel") {
        const order = ["1st year", "2nd year", "3rd year", "4th year"];
        const getIndex = (y) => order.indexOf(y?.toLowerCase?.() || "");
        return sortAsc
          ? getIndex(a.yearLevel) - getIndex(b.yearLevel)
          : getIndex(b.yearLevel) - getIndex(a.yearLevel);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents =
    itemsPerPage === "All"
      ? filteredStudents
      : filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Card>
      <div>
        <h2 className="mb-4">Student Management</h2>

        <div className="d-flex justify-content-between align-items-center mb-3">
          {currentRole !== "Student" && (
            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={() => setShowAddStudentModal(true)}>
                Add Student
              </button>
              <button className="btn btn-info" onClick={() => setShowAssignSubjectsModal(true)}>
                Assign Subjects
              </button>
            </div>
          )}
        </div>

        <div className="row my-3">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search by Name or Year Level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={itemsPerPage}
              onChange={(e) => {
                const value = e.target.value === "All" ? "All" : parseInt(e.target.value);
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            >
              {[5, 10, 20, "All"].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading students...</p>
          </div>
        ) : (
          <table className="table table-bordered table-hover mt-3">
            <thead className="table-light">
              <tr>
                <th>Student Number</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSortField("fullname");
                    setSortAsc(sortField === "fullname" ? !sortAsc : true);
                  }}
                >
                  Full Name {sortField === "fullname" && (sortAsc ? "▲" : "▼")}
                </th>
                <th>Department</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSortField("yearLevel");
                    setSortAsc(sortField === "yearLevel" ? !sortAsc : true);
                  }}
                >
                  Year Level {sortField === "yearLevel" && (sortAsc ? "▲" : "▼")}
                </th>
                <th>Subjects</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.studentNumber}</td>
                  <td>{student.fullname}</td>
                  <td>{student.department || "-"}</td>
                  <td>{student.yearLevel || "-"}</td>
                  <td>
                    {subjectsMap[student.id]?.length ? (
                      <ul className="list-unstyled mb-0">
                        {subjectsMap[student.id].map((sub) => (
                          <li key={sub.subjectId}>
                            <strong>{sub.subjectName}</strong> ({sub.subjectCode})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted">No subjects</span>
                    )}
                  </td>
                  <td>
                    {currentRole !== "Student" && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => confirmDelete(student.id)}
                      >
                        Delete
                      </button>
                    )}
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
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </Card>
  );
}

export default StudentSubject;
