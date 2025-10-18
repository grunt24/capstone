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
import loginService from '../../../api/loginService';

const { TabPane } = Tabs;

export default function StudentsGradesTable() {
  const [studentsByDept, setStudentsByDept] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedAY, setSelectedAY] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
    const [userRole, setUserRole] = useState('');

  // Fetch academic years & semesters
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

        setSelectedAY(result.data.currentAcademicYear);
        setSelectedSemester(result.data.currentSemester);
               const userDetails = loginService.getUserDetails();
        if (userDetails?.role) {
          setUserRole(userDetails.role);
        }
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load academic year and semester filters.");
    }
  };

  // Fetch grades filtered by AY & Semester
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

        // Group by department -> then by yearLevel -> then by studentId
        const grouped = rawData.reduce((deptAcc, item) => {
          if (!deptAcc[item.department]) deptAcc[item.department] = {};
          if (!deptAcc[item.department][item.yearLevel]) deptAcc[item.department][item.yearLevel] = {};
          if (!deptAcc[item.department][item.yearLevel][item.studentId]) {
            deptAcc[item.department][item.yearLevel][item.studentId] = {
              studentId: item.studentId,
              studentFullName: item.studentFullName,
              yearLevel: item.yearLevel,
              subjects: [],
            };
          }

          const finalsData = Array.isArray(item.finalGrade)
            ? item.finalGrade.find((f) => f.subjectId === item.subjectId)
            : item.finalGrade;

          deptAcc[item.department][item.yearLevel][item.studentId].subjects.push({
            subjectName: item.subjectName,
            subjectCode: item.subjectCode,
            midterm: item.midtermGrade ?? null,
            finals: finalsData ?? null,
          });

          return deptAcc;
        }, {});

        // Convert inner objects to arrays for tables
        const finalGrouped = Object.fromEntries(
          Object.entries(grouped).map(([dept, yearLevels]) => [
            dept,
            Object.fromEntries(
              Object.entries(yearLevels).map(([year, studentsObj]) => [
                year,
                Object.values(studentsObj),
              ])
            ),
          ])
        );

        setStudentsByDept(finalGrouped);
      } else {
        message.warning("No grades found for the selected filters.");
        setStudentsByDept({});
      }
    } catch (err) {
      console.error("Error fetching grades:", err);
      message.error("Failed to fetch student grades.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Midterm or Finals
  const handleCalculateGrades = async (type) => {
    setCalculating(true);
    try {
      if (type === "midterm") {
        await axiosInstance.post("/GradeCalculation/calculate-midterm-all");
      } else if (type === "finals") {
        await axiosInstance.post("/GradeCalculation/calculate-finals-all");
      }
      message.success(`${type === "midterm" ? "Midterm" : "Finals"} grades calculated successfully.`);
      if (selectedAY && selectedSemester) {
        fetchGrades(selectedAY, selectedSemester);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to calculate grades.");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchYearSemesterFilters();
  }, []);

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
    { title: "Student Name", dataIndex: "studentFullName", key: "studentFullName" },
    { title: "Year Level", dataIndex: "yearLevel", key: "yearLevel" },
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
    <Card>
      <div style={{ padding: 24 }}>
        <h2>Student Grades by Academic Year & Semester</h2>

        {/* Filters & Calculate Buttons */}
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
        {userRole === 'Admin' && (
        <>
          <Button
            type="primary"
            loading={calculating}
            onClick={() => handleCalculateGrades("midterm")}
          >
            Calculate Midterm
          </Button>
          <Button
            type="primary"
            loading={calculating}
            onClick={() => handleCalculateGrades("finals")}
          >
            Calculate Finals
          </Button>
          </>
        )}
        </Space>

        {/* Tabs by Department */}
        <Tabs type="card">
          {Object.entries(studentsByDept).map(([dept, yearLevels]) => (
            <TabPane key={dept} tab={dept}>
              <Tabs type="line">
                {Object.entries(yearLevels).map(([year, students]) => (
                  <TabPane key={year} tab={year}>
                    <Table
                      columns={columns}
                      dataSource={students}
                      rowKey="studentId"
                      loading={loading}
                      pagination={{ pageSize: 5 }}
                    />
                  </TabPane>
                ))}
              </Tabs>
            </TabPane>
          ))}
        </Tabs>

        {/* Modal for Student Details */}
        <Modal
          title={selectedStudent ? `${selectedStudent.studentFullName}'s Grades` : "Grades"}
          open={isModalVisible}
          onCancel={handleClose}
          footer={null}
          width={800}
        >
          {selectedStudent && (
            <Tabs defaultActiveKey="1" type="card">
              {selectedStudent.subjects.map((subject, idx) => (
                <TabPane key={idx} tab={`${subject.subjectName} (${subject.subjectCode})`}>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Card title="Midterm Breakdown" bordered>
                        {subject.midterm ? (
                          <>
                            <p><strong>Quiz PG:</strong> {subject.midterm.quizPG ?? "N/A"}</p>
                            <p><strong>Recitation:</strong> {subject.midterm.recitationScore ?? "N/A"}</p>
                            <p><strong>Attendance:</strong> {subject.midterm.attendanceScore ?? "N/A"}</p>
                            <p><strong>Class Standing PG:</strong> {subject.midterm.classStandingPG ?? "N/A"}</p>
                            <p><strong>Project:</strong> {subject.midterm.projectScore ?? "N/A"}</p>
                            <p><strong>SEP:</strong> {subject.midterm.sepScore ?? "N/A"}</p>
                            <p><strong>Total Midterm Grade:</strong> {subject.midterm.totalMidtermGradeRounded ?? "N/A"}</p>

                            {subject.midterm.quizzes?.length > 0 && (
                              <Table columns={quizColumns} dataSource={subject.midterm.quizzes} pagination={false} rowKey="id" size="small"/>
                            )}

                            {subject.midterm.classStandingItems?.length > 0 && (
                              <Table columns={classItemsColumns} dataSource={subject.midterm.classStandingItems} pagination={false} rowKey="id" size="small"/>
                            )}
                          </>
                        ) : <p>No midterm data available.</p>}
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card title="Finals Breakdown" bordered>
                        {subject.finals ? (
                          <>
                            <p><strong>Quiz PG:</strong> {subject.finals.quizPG ?? "N/A"}</p>
                            <p><strong>Recitation:</strong> {subject.finals.recitationScore ?? "N/A"}</p>
                            <p><strong>Attendance:</strong> {subject.finals.attendanceScore ?? "N/A"}</p>
                            <p><strong>Class Standing PG:</strong> {subject.finals.classStandingPG ?? "N/A"}</p>
                            <p><strong>Project:</strong> {subject.finals.projectScore ?? "N/A"}</p>
                            <p><strong>SEP:</strong> {subject.finals.sepScore ?? "N/A"}</p>
                            <p><strong>Total Finals Grade:</strong> {subject.finals.totalFinalsGradeRounded ?? "N/A"}</p>

                            {subject.finals.quizzes?.length > 0 && (
                              <Table columns={quizColumns} dataSource={subject.finals.quizzes} pagination={false} rowKey="id" size="small"/>
                            )}

                            {subject.finals.classStandingItems?.length > 0 && (
                              <Table columns={classItemsColumns} dataSource={subject.finals.classStandingItems} pagination={false} rowKey="id" size="small"/>
                            )}
                          </>
                        ) : <p>No finals data available.</p>}
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              ))}
            </Tabs>
          )}
        </Modal>
      </div>
    </Card>
  );
}
