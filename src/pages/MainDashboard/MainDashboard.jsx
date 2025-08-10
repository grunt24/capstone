import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Card, Row, Col } from 'antd';
import StudentSubject from './StudentSubject';
import Teacher from './Teacher';
import Subjects from './Subjects';
import axiosInstance from '../../../api/axiosInstance';
import dummyGrades from '../../../api/dummyGrades';

function MainDashboard() {
  const [data, setData] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [gradeCounts, setGradeCounts] = useState({ valid: 0, invalid: 0 });
  const [departmentCounts, setDepartmentCounts] = useState({});

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const { data: users } = await axiosInstance.get('/Auth/all-users');

      const roles = { Admin: 0, Teacher: 0, Student: 0 };
      const departments = {};

      users.forEach(user => {
        const role = user.role;
        roles[role] = (roles[role] || 0) + 1;

        if (role === 'Student' && user.department) {
          departments[user.department] = (departments[user.department] || 0) + 1;
        }
      });

      // Use mock grades to simulate valid/invalid grade counts
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
        {/* <Col xs={24} sm={12} md={6}>
          <Card title="Admins" bordered={false}>
            {roleCounts.Admin || 0}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Teachers" bordered={false}>
            {roleCounts.Teacher || 0}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Students" bordered={false}>
            {roleCounts.Student || 0}
          </Card>
        </Col> */}
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

        {/* Department Cards for Students */}
        {Object.keys(departmentCounts).map(dept => (
          <Col key={dept} xs={24} sm={12} md={6}>
            <Card title={`${dept}`} bordered={false}>
              {departmentCounts[dept]}
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ width: '100%', height: 400, marginTop: 40 }}>
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

      <Card title="Student Subjects" className="mt-4" bordered={false}>
        <StudentSubject />
      </Card>
      
      <Card title="Subjects" className="mt-4" bordered={false}>
        <Subjects />
      </Card>
      
      <Card title="Teacher Management" className="mt-4" bordered={false}>
        <Teacher />
      </Card>
    </>
  );
}

export default MainDashboard;

// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
// } from 'recharts';
// import StudentSubject from './StudentSubject';
// import Teacher from './Teacher';
// import Subjects from './Subjects';
// import axiosInstance from '../../../api/axiosInstance';

// function MainDashboard() {
//   const [data, setData] = useState([]);

//   // Fetch users and count roles
// useEffect(() => {
//   const fetchUserData = async () => {
//     try {
//       const { data: users } = await axiosInstance.get('/Auth/all-users');

//       // Count roles
//       const roleCounts = users.reduce((acc, user) => {
//         const role = user.role;
//         acc[role] = (acc[role] || 0) + 1;
//         return acc;
//       }, {});

//       // Convert to chart data format
//       const chartData = Object.keys(roleCounts).map(role => ({
//         role,
//         count: roleCounts[role]
//       }));

//       setData(chartData);
//     } catch (error) {
//       console.error('Failed to fetch users:', error);
//     }
//   };

//   fetchUserData();
// }, []);


//   return (
//     <>
//         <div style={{ width: '100%', height: 400 }}>
//       <h2>User Overview</h2>
//       <ResponsiveContainer width="100%" height="100%">
//         <BarChart data={data} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="role" />
//           <YAxis allowDecimals={false} />
//           <Tooltip />
//           <Bar dataKey="count" fill="#8884d8" />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
// <div> 
//     <StudentSubject/>
// </div>
// <div>
//     <Subjects/>
// </div>
// <div>
// <Teacher/>
// </div>
//     </>
//   );
// }

// export default MainDashboard;