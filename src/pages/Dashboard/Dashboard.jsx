import { useState } from "react";
import { Table, Button, Modal } from "antd";

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const showModal = (student) => {
    setSelectedStudent(student);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedStudent(null);
  };

  const columns = [
    {
      title: "Student ID",
      dataIndex: "studentId",
      key: "studentId",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => showModal(record)}>
          View
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      studentId: "2025-101",
      name: "Lawrence Paolo Mercado Caguicla",
      department: "IT",
      subjects: [
        { subject: "Capstone", assessment: 85, quiz: 90, exam: 88 },
        { subject: "Programming", assessment: 78, quiz: 82, exam: 80 },
        { subject: "Database", assessment: 92, quiz: 95, exam: 94 },
      ],
    },
    {
      key: "2",
      studentId: "2025-102",
      name: "Roxanne Recio",
      department: "IT",
      subjects: [
        { subject: "Capstone", assessment: 75, quiz: 78, exam: 80 },
        { subject: "Database", assessment: 88, quiz: 85, exam: 87 },
      ],
    },
    {
      key: "3",
      studentId: "2025-102",
      name: "Shaina Borres",
      department: "IT",
      subjects: [
        { subject: "Capstone", assessment: 75, quiz: 78, exam: 80 },
        { subject: "Database", assessment: 88, quiz: 85, exam: 87 },
      ],
    },
  ];

  const subjectColumns = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Assessment",
      dataIndex: "assessment",
      key: "assessment",
    },
    {
      title: "Quiz",
      dataIndex: "quiz",
      key: "quiz",
    },
    {
      title: "Exam",
      dataIndex: "exam",
      key: "exam",
    },
  ];

  return (
    <div style={{ padding: 20, margin: "auto", background: "#fff" }}>
      <Table columns={columns} dataSource={data} pagination={false} />

      {/* Modal for Viewing Student Details */}
      <Modal
        title="Student Details"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        {selectedStudent && (
          <>
            <p><strong>Name:</strong> {selectedStudent.name}</p>
            <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
            <p><strong>Department:</strong> {selectedStudent.department}</p>
            
            <h3>Subjects & Scores</h3>
            <Table
              columns={subjectColumns}
              dataSource={selectedStudent.subjects}
              pagination={false}
              rowKey="subject"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
