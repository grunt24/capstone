import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import { Card, Row, Col } from 'antd';
import StudentSubject from './StudentSubject';
import Teacher from './Teacher/Teacher';
import Subjects from './Subjects';
import UserEvents from './UserEvents';
import axiosInstance from '../../../api/axiosInstance';
import dummyGrades from '../../../api/dummyGrades';
import loginService from '../../../api/loginService'; // import your loginService



function MainDashboard() {
  const [data, setData] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [gradeCounts, setGradeCounts] = useState({ valid: 0, invalid: 0 });
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [studentGroupData, setStudentGroupData] = useState([]); // NEW: grouped students by year + dept
  const [userRole, setUserRole] = useState('');
  const [groupedChartData, setGroupedChartData] = useState([]);
const [yearLevels, setYearLevels] = useState([]); // for dynamic bar keys
const [gradeInfo, setGradeInfo] = useState({
  midtermCount: 0,
  finalCount: 0,
  currentSemester: '',
  currentAcademicYear: '',
});


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

// Transform the grouped student data to match Recharts format
const departmentYearMap = {};
const allYearLevels = new Set();

studentGroup.forEach(group => {
  const year = group.yearLevel;
  allYearLevels.add(year);

  group.departments.forEach(dept => {
    if (!departmentYearMap[dept.department]) {
      departmentYearMap[dept.department] = { department: dept.department };
    }
    departmentYearMap[dept.department][year] = dept.count;
  });
});

const { data: gradeResponse } = await axiosInstance.get('/GradeCalculation/grades-count');

if (gradeResponse.success) {
  setGradeInfo(gradeResponse.data);
}


const chartData = Object.values(departmentYearMap);

setGroupedChartData(chartData);
setYearLevels(Array.from(allYearLevels));


        const roles = { Admin: 0, Teacher: 0, Student: 0 };
        const departments = {};

        users.forEach(user => {
          if (user.role === 'Superadmin') return;
          const role = user.role;
          roles[role] = (roles[role] || 0) + 1;

          if (role === 'Student' && user.department) {
            departments[user.department] = (departments[user.department] || 0) + 1;
          }
        });

        const gradeCounts = dummyGrades.reduce((acc, g) => {
          if (g.grade >= 75) acc.valid += 1;
          else acc.invalid += 1;
          return acc;
        }, { valid: 0, invalid: 0 });

        setData(Object.keys(roles).map(role => ({ role, count: roles[role] })));
        setRoleCounts(roles);
        setDepartmentCounts(departments);
        setGradeCounts(gradeCounts);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
<h2>Overview for  {gradeInfo.currentAcademicYear || 'N/A'}, {gradeInfo.currentSemester || 'N/A'}</h2>
{/* <p>
  <strong>Semester:</strong> <br />
  <strong>Academic Year:</strong> {gradeInfo.currentAcademicYear || 'N/A'}
</p> */}

<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} md={6}>
    <Card title="Midterm Uploaded Grade Count" bordered={false}>
      {gradeInfo.midtermCount}
    </Card>
  </Col>
  <Col xs={24} sm={12} md={6}>
    <Card title="Finals Uploaded Grade Count" bordered={false}>
      {gradeInfo.finalCount}
    </Card>
  </Col>
</Row>

      <Row gutter={[16, 16]}>
        {Object.keys(departmentCounts).map(dept => (
          <Col key={dept} xs={24} sm={12} md={6}>
            <Card title={dept} bordered={false}>
              {departmentCounts[dept]}
            </Card>
          </Col>
        ))}
      </Row>

<h3 style={{ marginTop: 40 }}>Student Count by Department and Year</h3>
<div style={{ width: '100%', height: 400 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={groupedChartData}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="department" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      {yearLevels.map((year, index) => (
        <Bar
          key={year}
          dataKey={year}
          fill={getColor(index)}
          name={year}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
</div>




      {/* 50:50 Layout */}
      <Row gutter={[16, 16]} style={{ marginTop: 40 }}>
        <Col xs={24} sm={24} md={12}>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Conditionally render UserEvents */}
        {userRole !== 'Teacher' && userRole !== 'User' && (
          <Col xs={24} sm={24} md={12}>
            <Card title="User Events" bordered={false}>
              <UserEvents />
            </Card>
          </Col>
        )}
      </Row>

      <Card title="Student Subjects" className="mt-4" bordered={false}>
        <StudentSubject />
      </Card>

      {/* Hide for Teacher/User roles */}
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
