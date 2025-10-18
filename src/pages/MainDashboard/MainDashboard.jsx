import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Card, Row, Col } from 'antd';
import StudentSubject from './StudentSubject';
import Teacher from './Teacher/Teacher';
import Subjects from './Subjects';
import UserEvents from './UserEvents';
import axiosInstance from '../../../api/axiosInstance';
import dummyGrades from '../../../api/dummyGrades';
import loginService from '../../../api/loginService';
import TeacherStudents from './Teacher/TeacherStudents';

function MainDashboard() {
  const [data, setData] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [gradeCounts, setGradeCounts] = useState({ valid: 0, invalid: 0 });
  const [studentGroupData, setStudentGroupData] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [gradeInfo, setGradeInfo] = useState({
    midtermCount: 0,
    finalCount: 0,
    currentSemester: '',
    currentAcademicYear: '',
  });
  const [teacherChartData, setTeacherChartData] = useState([]); // ✅ Chart for teacher

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a83279'];
  const getColor = (index) => COLORS[index % COLORS.length];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user role
        const userDetails = loginService.getUserDetails();
        if (userDetails?.role) {
          setUserRole(userDetails.role);
        }

        // Fetch all users
        const { data: users } = await axiosInstance.get('/Auth/all-users');

        // Fetch students grouped by year & department
        const { data: studentGroup } = await axiosInstance.get('/Auth/students-by-year-department');
        setStudentGroupData(studentGroup);

        // Fetch grade counts (midterm/final)
        const { data: gradeResponse } = await axiosInstance.get('/GradeCalculation/grades-count');
        if (gradeResponse.success) {
          setGradeInfo(gradeResponse.data);
        }

        // Count roles
        const roles = { Admin: 0, Teacher: 0, Student: 0 };
        users.forEach(user => {
          if (user.role === 'Superadmin') return;
          const role = user.role;
          roles[role] = (roles[role] || 0) + 1;
        });

        const gradeCounts = dummyGrades.reduce((acc, g) => {
          if (g.grade >= 75) acc.valid += 1;
          else acc.invalid += 1;
          return acc;
        }, { valid: 0, invalid: 0 });

        setData(Object.keys(roles).map(role => ({ role, count: roles[role] })));
        setRoleCounts(roles);
        setGradeCounts(gradeCounts);

        // ✅ Fetch teacher students and prepare chart data
        if (userDetails.role === 'Teacher') {
          const { data: teacherData } = await axiosInstance.get('/Teachers/my-students');
          // Transform: [{subjectName, studentCount}]
          const chartData = teacherData.map(sub => ({
            subjectName: sub.subjectName,
            studentCount: sub.students?.length || 0
          }));
          setTeacherChartData(chartData);
        }

      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card title="Calculated Midterm Grade Count" bordered={false}>
            {gradeInfo.midtermCount}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Calculated Finals Grade Count" bordered={false}>
            {gradeInfo.finalCount}
          </Card>
        </Col>
      </Row>

      {/* 🆕 Department cards showing counts per year level */}
      <Row gutter={[16, 16]}>
        {(() => {
          const deptMap = {};
          studentGroupData.forEach((yearGroup) => {
            const year = yearGroup.yearLevel;
            yearGroup.departments.forEach((dept) => {
              if (!deptMap[dept.department]) deptMap[dept.department] = [];
              deptMap[dept.department].push({ yearLevel: year, count: dept.count });
            });
          });

          return Object.keys(deptMap).map((dept, index) => (
            <Col key={index} xs={24} sm={12} md={6}>
              <Card title={dept} bordered={false}>
                {deptMap[dept].map((item, i) => (
                  <p key={i}>{item.yearLevel} - {item.count}</p>
                ))}
              </Card>
            </Col>
          ));
        })()}
      </Row>

<Row gutter={[16, 16]} style={{ marginTop: 40 }}>
<Col xs={24} sm={24} md={12}>
  <Card title="User Roles Distribution" bordered={false}>
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="role"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </Card>
</Col>

  {/* Right column: either UserEvents (Admin) or Teacher chart */}
  <Col xs={24} sm={24} md={12}>
    {userRole !== 'Teacher' && userRole !== 'User' ? (
      <Card title="User Events" bordered={false}>
        <UserEvents />
      </Card>
    ) : (
      userRole === 'Teacher' && teacherChartData.length > 0 && (
        <Card title="My Students Per Subject" bordered={false}>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherChartData}
                margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subjectName" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="studentCount" name="Students" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )
    )}
  </Col>
</Row>

      {userRole === 'Teacher' && (
        <>
      <Card title="My Students List" className="mt-4" bordered={false}>
        <TeacherStudents />
      </Card>
        </>
      )}
        


      {userRole !== 'Teacher' && userRole !== 'Student' && (
        <>
          <Card title="Subjects" className="mt-4" bordered={false}>
            <Subjects />
          </Card>

          <Card title="Teacher Management" className="mt-4" bordered={false}>
            <Teacher />
          </Card>
        </>
      )}
    </>
  );
}

export default MainDashboard;
