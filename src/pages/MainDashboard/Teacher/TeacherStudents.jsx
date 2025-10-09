import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import 'bootstrap/dist/css/bootstrap.min.css';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyStudents = async () => {
      try {
        const response = await axiosInstance.get('/Teachers/my-students');
        setStudents(response.data);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStudents();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">My Students</h2>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="alert alert-info">No students assigned to you.</div>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Student Name</th>
              <th>Subjects</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.userId}>
                <td>{student.fullname}</td>
                <td>
                  <ul className="mb-0 list-unstyled">
                    {student.subjects.map((subject, index) => (
                      <li key={index}>
                        <strong>{subject.subjectName}</strong> ({subject.subjectCode})
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherStudents;
