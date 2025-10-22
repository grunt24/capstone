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
  Spin,
} from "antd";
import axiosInstance from "../../../api/axiosInstance";
import loginService from "../../../api/loginService";

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
  const [userRole, setUserRole] = useState("");

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
        if (userDetails?.role) setUserRole(userDetails.role);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load academic year and semester filters.");
    }
  };

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

        const grouped = rawData.reduce((deptAcc, item) => {
          if (!deptAcc[item.department]) deptAcc[item.department] = {};
          if (!deptAcc[item.department][item.yearLevel])
            deptAcc[item.department][item.yearLevel] = {};
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

  const handleCalculateGrades = async (type) => {
    setCalculating(true);
    try {
      if (type === "midterm") {
        await axiosInstance.post("/GradeCalculation/calculate-midterm-all");
      } else {
        await axiosInstance.post("/GradeCalculation/calculate-finals-all");
      }

      message.success(
        `${type === "midterm" ? "Midterm" : "Finals"} grades calculated successfully.`
      );

      if (selectedAY && selectedSemester) {
        await fetchGrades(selectedAY, selectedSemester);
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

  const columns = [
    { title: "Student Name", dataIndex: "studentFullName", key: "studentFullName" },
    { title: "Year Level", dataIndex: "yearLevel", key: "yearLevel" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => setSelectedStudent(record)}>
          View Grades
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* 🔄 Full-screen loading overlay */}
      {calculating && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Spin size="large" tip="Calculating..." />
        </div>
      )}

      <Card>
        <div style={{ padding: 24 }}>
          <h2>Student Grades by Academic Year & Semester</h2>

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

            {userRole === "Admin" && (
              <>
                <Button type="primary" onClick={() => handleCalculateGrades("midterm")}>
                  Calculate Midterm
                </Button>
                <Button type="primary" onClick={() => handleCalculateGrades("finals")}>
                  Calculate Finals
                </Button>
              </>
            )}
          </Space>

          {/* Department Tabs */}
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
        </div>
      </Card>
    </>
  );
}
