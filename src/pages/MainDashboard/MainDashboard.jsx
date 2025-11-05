import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Card, Row, Col, Modal, Table, Button } from 'antd';
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
    const [yearDeptModal, setYearDeptModal] = useState({ visible: false, students: [], title: '' });
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

    // Table columns for the modal
  const columns = [
    { title: 'Student Number', dataIndex: 'studentNumber', key: 'studentNumber' },
    { title: 'Full Name', dataIndex: 'fullname', key: 'fullname' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Year Level', dataIndex: 'yearLevel', key: 'yearLevel' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
  ];

    const deptMap = {};
  studentGroupData.forEach(yearGroup => {
    yearGroup.departments.forEach(dept => {
      if (!deptMap[dept.department]) deptMap[dept.department] = [];
      deptMap[dept.department].push({
        yearLevel: yearGroup.yearLevel,
        count: dept.count,
        students: dept.students
      });
    });
  });

  return (
    <>

      {/* {userRole === 'Admin' && (
        <Row gutter={[16, 16]}>
          {Object.keys(deptMap).map((dept, idx) => (
            <Col key={dept} xs={24} sm={12} md={6}>
              <Card title={dept} bordered={false}>
                {deptMap[dept].map((item, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Button
                      type="link"
                      onClick={() =>
                        setYearDeptModal({
                          visible: true,
                          students: item.students,
                          title: `${item.yearLevel} - ${dept}`
                        })
                      }
                    >
                      {item.yearLevel} - {item.count} Student{item.count > 1 ? 's' : ''}
                    </Button>
                  </div>
                ))}
              </Card>
            </Col>
          ))}
        </Row>
      )} */}

      {/* Modal to show students */}
      <Modal
        title={yearDeptModal.title}
        open={yearDeptModal.visible}
        width={800}
        onCancel={() => setYearDeptModal({ visible: false, students: [], title: '' })}
        footer={null}
      >
        <Table
          dataSource={yearDeptModal.students}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

<Row gutter={[16, 16]} style={{ marginTop: 40 }}>
  {/* ✅ LEFT COLUMN FOR ADMIN */}
  {userRole === 'Admin' && (
    <Col xs={24} sm={24} md={12} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* User Roles Distribution */}
      <Card title="User Roles Distribution" variant style={{ flex: 1 }}>
        <div style={{ width: '100%', height: 300 }}>
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

      {/* Midterm + Finals Count */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card title="Calculated Midterm Grade Count" variant style={{ height: '100%' }}>
            <div style={{ fontSize: 24, textAlign: 'center', padding: '24px 0' }}>
              {gradeInfo.midtermCount}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="Calculated Finals Grade Count" variant style={{ height: '100%' }}>
            <div style={{ fontSize: 24, textAlign: 'center', padding: '24px 0' }}>
              {gradeInfo.finalCount}
            </div>
          </Card>
        </Col>
      </Row>
    </Col>
  )}

  {/* ✅ RIGHT COLUMN (Admin) or FULL ROW (Teacher) */}
  <Col
    xs={24}
    sm={24}
    md={userRole === 'Teacher' ? 24 : 12}
    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
  >
    {/* Admin: User Events (only once) */}
    {userRole === 'Admin' && (
      <Card variant style={{ flex: 1 }}>
        <UserEvents />
      </Card>
    )}

    {/* Teacher: Layout changes */}
    {userRole === 'Teacher' && (
      <>
        {/* User Role Distribution full width */}

        {/* Midterm + Finals Count side by side */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card title="Calculated Midterm Grade Count" variant>
              <div style={{ fontSize: 24, textAlign: 'center', padding: '24px 0' }}>
                {gradeInfo.midtermCount}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card title="Calculated Finals Grade Count" variant>
              <div style={{ fontSize: 24, textAlign: 'center', padding: '24px 0' }}>
                {gradeInfo.finalCount}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Teacher Chart */}
        {teacherChartData.length > 0 && (
          <Card title="My Students Per Subject" variant>
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
        )}
      </>
    )}
  </Col>
</Row>



      {userRole === 'Teacher' && (
        <>
      <Card title="My Students List" className="mt-4" variant={false}>
        <TeacherStudents />
      </Card>
        </>
      )}
        


      {userRole !== 'Teacher' && userRole !== 'Student' && (
        <>
          <Card title="Subjects" className="mt-4" variant={false}>
            <Subjects />
          </Card>

          <Card title="Teacher Management" className="mt-4" variant={false}>
            <Teacher />
          </Card>
        </>
      )}
    </>
  );
}

export default MainDashboard;
