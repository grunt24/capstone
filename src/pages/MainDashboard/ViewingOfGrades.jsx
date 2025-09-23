import React, { useEffect, useState } from 'react';
import { Table, Button, Modal } from 'antd';
import axios from 'axios';

const ViewingOfGrades = () => {
  const [midtermData, setMidtermData] = useState([]);
  const [finalData, setFinalData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch midterm and final data
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const midtermRes = await axios.get('https://localhost:7255/api/GradeCalculation/students-midtermGrades');
        const finalRes = await axios.get('https://localhost:7255/api/GradeCalculation/students-finalGrades');

        setMidtermData(midtermRes.data.data || []);
        setFinalData(finalRes.data.data || []);
      } catch (error) {
        console.error('Error fetching grades:', error);
      }
    };

    fetchGrades();
  }, []);

  // Merge midterm and final data by studentId
  useEffect(() => {
    if (midtermData.length && finalData.length) {
      const merged = midtermData.map(mid => {
        const final = finalData.find(f => f.studentId === mid.studentId);
        return {
          key: mid.studentId,
          studentId: mid.studentId,
          studentFullName: mid.studentFullName,
          midterm: mid,
          finals: final
        };
      });

      setMergedData(merged);
    }
  }, [midtermData, finalData]);

  const showModal = (record) => {
    setSelectedStudent(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudent(null);
  };

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'studentFullName',
      key: 'studentFullName',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => showModal(record)}>
          Breakdown
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2>Viewing of Grades</h2>
      <Table columns={columns} dataSource={mergedData} />

      <Modal
        title={`Grade Breakdown: ${selectedStudent?.studentFullName}`}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        {selectedStudent && (
          <div>
            <h3>📘 Midterm Grades</h3>
            <ul>
              <li>Quiz PG: {selectedStudent.midterm.quizPG}</li>
              <li>Recitation: {selectedStudent.midterm.recitationScore}</li>
              <li>Attendance: {selectedStudent.midterm.attendanceScore}</li>
              <li>Class Standing PG: {selectedStudent.midterm.classStandingPG}</li>
              <li>Project: {selectedStudent.midterm.projectScore}</li>
              <li>SEP: {selectedStudent.midterm.sepScore}</li>
              <li>Prelim: {selectedStudent.midterm.prelimScore} / {selectedStudent.midterm.prelimTotal}</li>
              <li>Midterm: {selectedStudent.midterm.midtermScore} / {selectedStudent.midterm.midtermTotal}</li>
              <li>Combined Average: {selectedStudent.midterm.combinedPrelimMidtermAverage}</li>
              <li>Total Midterm Grade: {selectedStudent.midterm.totalMidtermGradeRounded}</li>
            </ul>
                        {selectedStudent.finals?.quizzes?.length > 0 && (
              <>
                <h3>📝 Midterm Quizzes</h3>
                <ul>
                  {selectedStudent.midterm.quizzes.map(q => (
                    <li key={q.id}>
                      {q.label}: {q.quizScore} / {q.totalQuizScore}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3>📕 Final Grades</h3>
            {selectedStudent.finals ? (
              <ul>
                <li>Quiz PG: {selectedStudent.finals.quizPG}</li>
                <li>Recitation: {selectedStudent.finals.recitationScore}</li>
                <li>Attendance: {selectedStudent.finals.attendanceScore}</li>
                <li>Class Standing PG: {selectedStudent.finals.classStandingPG}</li>
                <li>Project: {selectedStudent.finals.projectScore}</li>
                <li>SEP: {selectedStudent.finals.sepScore}</li>
                <li>Finals: {selectedStudent.finals.finalsScore} / {selectedStudent.finals.finalsTotal}</li>
                <li>Combined Finals Average: {selectedStudent.finals.combinedFinalsAverage}</li>
                <li>Total Finals Grade: {selectedStudent.finals.totalFinalsGradeRounded}</li>
              </ul>
            ) : (
              <p>No final grades found.</p>
            )}

            {selectedStudent.finals?.quizzes?.length > 0 && (
              <>
                <h3>📝 Final Quizzes</h3>
                <ul>
                  {selectedStudent.finals.quizzes.map(q => (
                    <li key={q.id}>
                      {q.label}: {q.quizScore} / {q.totalQuizScore}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewingOfGrades;
