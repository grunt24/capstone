import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Tabs,
  Card,
  Row,
  Col,
  Select,
  Space,
  message,
} from "antd";
import axiosInstance from "../../../api/axiosInstance";

const { TabPane } = Tabs;

export default function StudentsGradesTable() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedAY, setSelectedAY] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch academic years & semesters dynamically
  const fetchYearSemesterFilters = async () => {
    try {
      const res = await axiosInstance.get("/GradeCalculation/grades-count");
      const result = res.data;
      if (result.success && result.data.academicYearSemesterFilters) {
        const uniqueYears = new Set();
        const uniqueSemesters = new Set();

        result.data.academicYearSemesterFilters.forEach((item) => {
          const parts = item.split(" ");
          const year = "AY " + parts[0];
          const semester = parts.slice(1).join(" ");
          uniqueYears.add(year);
          uniqueSemesters.add(semester);
        });

        setAcademicYears(
          Array.from(uniqueYears).map((y) => ({ label: y, value: y }))
        );
        setSemesters(
          Array.from(uniqueSemesters).map((s) => ({ label: s, value: s }))
        );

        // Auto-select current AY and Sem if available
        setSelectedAY(result.data.currentAcademicYear);
        setSelectedSemester(result.data.currentSemester);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load academic year and semester filters.");
    }
  };

  // ✅ Fetch grades filtered by AY & Semester
const fetchGrades = async (ay, sem) => {
  if (!ay || !sem) return;
  setLoading(true);
  try {
    const res = await axiosInstance.get(
      "/GradeCalculation/students-grades-by-ay-semester",
      { params: { academicYear: ay, semester: sem } }
    );

    if (res.data.success && Array.isArray(res.data.data)) {
      const rawData = res.data.data;

      // ✅ Group data by studentId
      const grouped = Object.values(
        rawData.reduce((acc, item) => {
          if (!acc[item.studentId]) {
            acc[item.studentId] = {
              studentId: item.studentId,
              studentFullName: item.studentFullName,
              subjects: [],
            };
          }

          // ✅ Handle finals array properly (find the right student-subject match)
          const finalsData = Array.isArray(item.finalGrade)
            ? item.finalGrade.find(
                (f) =>
                  f.studentId === item.studentId &&
                  f.subjectId === item.subjectId
              )
            : item.finalGrade;

          // ✅ Push each subject into the student's subjects list
          acc[item.studentId].subjects.push({
            subjectName: item.subjectName,
            subjectCode: item.subjectCode,
            midterm: item.midtermGrade ?? null,
            finals: finalsData ?? null,
          });

          return acc;
        }, {})
      );

      setStudents(grouped);
    } else {
      message.warning("No grades found for the selected filters.");
      setStudents([]);
    }
  } catch (err) {
    console.error("Error fetching grades:", err);
    message.error("Failed to fetch student grades.");
  } finally {
    setLoading(false);
  }
};



  // Load filters on mount
  useEffect(() => {
    fetchYearSemesterFilters();
  }, []);

  // Auto-fetch grades when AY or Sem changes
  useEffect(() => {
    if (selectedAY && selectedSemester) {
      fetchGrades(selectedAY, selectedSemester);
    }
  }, [selectedAY, selectedSemester]);

  const handleViewGrades = (student) => {
    setSelectedStudent(student);
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setSelectedStudent(null);
  };

  const columns = [
    {
      title: "Student Name",
      dataIndex: "studentFullName",
      key: "studentFullName",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewGrades(record)}>
          View Grades
        </Button>
      ),
    },
  ];

  const quizColumns = [
    { title: "Quiz", dataIndex: "label", key: "label" },
    { title: "Score", dataIndex: "quizScore", key: "quizScore" },
    { title: "Total", dataIndex: "totalQuizScore", key: "totalQuizScore" },
  ];

  const classItemsColumns = [
    { title: "Class Standing Items", dataIndex: "label", key: "label" },
    { title: "Score", dataIndex: "score", key: "score" },
    { title: "Total", dataIndex: "total", key: "total" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Student Grades by Academic Year & Semester</h2>

      {/* ✅ Filters */}
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Select Academic Year"
          style={{ width: 220 }}
          options={academicYears}
          value={selectedAY}
          onChange={setSelectedAY}
        />
        <Select
          placeholder="Select Semester"
          style={{ width: 220 }}
          options={semesters}
          value={selectedSemester}
          onChange={setSelectedSemester}
        />
      </Space>

      {/* ✅ Table */}
      <Table
        columns={columns}
        dataSource={students}
        rowKey="studentId"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {/* ✅ Modal for details */}
      <Modal
        title={
          selectedStudent
            ? `${selectedStudent.studentFullName}'s Grades`
            : "Grades"
        }
        open={isModalVisible}
        onCancel={handleClose}
        footer={null}
        width={800}
      >
        {selectedStudent && (
          <Tabs defaultActiveKey="1" type="card">
            {selectedStudent.subjects.map((subject, idx) => (
              <TabPane
                key={idx}
                tab={`${subject.subjectName} (${subject.subjectCode})`}
              >
                <Row gutter={16}>
                  {/* MIDTERM */}
                  <Col xs={24} md={12}>
                    <Card title="Midterm Breakdown" bordered>
                      {subject.midterm ? (
                        <>
                          <p>
                            <strong>Quiz PG:</strong>{" "}
                            {subject.midterm.quizPG ?? "N/A"}
                          </p>
                          <p>
                            <strong>Recitation:</strong>{" "}
                            {subject.midterm.recitationScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Attendance:</strong>{" "}
                            {subject.midterm.attendanceScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Class Standing PG:</strong>{" "}
                            {subject.midterm.classStandingPG ?? "N/A"}
                          </p>
                          <p>
                            <strong>Project:</strong>{" "}
                            {subject.midterm.projectScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>SEP:</strong> {subject.midterm.sepScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Total Midterm Grade:</strong>{" "}
                            {subject.midterm.totalMidtermGradeRounded ?? "N/A"}
                          </p>

                          {subject.midterm.quizzes?.length > 0 ? (
                            <Table
                              columns={quizColumns}
                              dataSource={subject.midterm.quizzes}
                              pagination={false}
                              rowKey="id"
                              size="small"
                            />
                          ) : (
                            <p>No quizzes available.</p>
                          )}

                          {subject.midterm.classStandingItems?.length > 0 ? (
                            <Table
                              columns={classItemsColumns}
                              dataSource={subject.midterm.classStandingItems}
                              pagination={false}
                              rowKey="id"
                              size="small"
                            />
                          ) : (
                            <p>No class items available.</p>
                          )}

                        </>
                      ) : (
                        <p>No midterm data available.</p>
                      )}
                    </Card>
                  </Col>

                  {/* FINALS */}
                  <Col xs={24} md={12}>
                    <Card title="Finals Breakdown" bordered>
                      {subject.finals ? (
                        <>
                          <p>
                            <strong>Quiz PG:</strong>{" "}
                            {subject.finals.quizPG ?? "N/A"}
                          </p>
                          <p>
                            <strong>Recitation:</strong>{" "}
                            {subject.finals.recitationScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Attendance:</strong>{" "}
                            {subject.finals.attendanceScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Class Standing PG:</strong>{" "}
                            {subject.finals.classStandingPG ?? "N/A"}
                          </p>
                          <p>
                            <strong>Project:</strong>{" "}
                            {subject.finals.projectScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>SEP:</strong>{" "}
                            {subject.finals.sepScore ?? "N/A"}
                          </p>
                          <p>
                            <strong>Total Finals Grade:</strong>{" "}
                            {subject.finals.totalFinalsGradeRounded ?? "N/A"}
                          </p>

                          {subject.finals.quizzes?.length > 0 ? (
                            <Table
                              columns={quizColumns}
                              dataSource={subject.finals.quizzes}
                              pagination={false}
                              rowKey="id"
                              size="small"
                            />
                          ) : (
                            <p>No quizzes available.</p>
                          )}

                          {subject.finals.classStandingItems?.length > 0 ? (
                            <Table
                              columns={classItemsColumns}
                              dataSource={subject.finals.classStandingItems}
                              pagination={false}
                              rowKey="id"
                              size="small"
                            />
                          ) : (
                            <p>No class items available.</p>
                          )}

                        </>
                      ) : (
                        <p>No finals data available.</p>
                      )}
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            ))}
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
