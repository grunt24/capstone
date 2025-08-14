import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Card, Row, Col } from 'antd';
import StudentSubject from './StudentSubject';
import Teacher from './Teacher';
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
  const [userRole, setUserRole] = useState('');

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

        const roles = { Admin: 0, Teacher: 0, Student: 0 };
        const departments = {};

        users.forEach(user => {
          if (user.role === 'Superadmin') return; // Skip superadmins
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
      <h2>User Overview</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card title="Valid Grades" bordered={false}>
            {gradeCounts.valid}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Invalid Grades" bordered={false}>
            {gradeCounts.invalid}
          </Card>
        </Col>

        {Object.keys(departmentCounts).map(dept => (
          <Col key={dept} xs={24} sm={12} md={6}>
            <Card title={dept} bordered={false}>
              {departmentCounts[dept]}
            </Card>
          </Col>
        ))}
      </Row>

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
