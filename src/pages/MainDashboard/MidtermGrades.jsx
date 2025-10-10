// src/components/MidtermGradesTable.js 

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Popconfirm,
  Upload,
  Modal,
  Tag,
  Descriptions,
  Form,
  Input,
  Select,
  Spin
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GradePercentage from "./Graph/GradePercentage";
import axiosInstance from '../../../api/axiosInstance';


const API_URL = "/GradeCalculation/students-midtermGrades";
const DELETE_API_URL = "/GradeCalculation/delete-midtermGrades";
const UPLOAD_API_URL = "/GradeCalculation/upload-midterm";
const MANUAL_INSERT_API = "/GradeCalculation/manual-insert";
const ALL_STUDENTS_API = "/Auth/all-students";

function MidtermGradesTableContent() {
  const [grades, setGrades] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [manualForm] = Form.useForm();
  const [students, setStudents] = useState([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const gradesResponse = await axiosInstance.get(API_URL);
      const studentsResponse = await axiosInstance.get(ALL_STUDENTS_API);

      setGrades(gradesResponse?.data?.data || []);
      setStudents(studentsResponse?.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Delete handler
  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      toast.warning("Please select at least one grade to delete.");
      return;
    }

    try {
      const response = await axiosInstance.delete(DELETE_API_URL, {
        data: selectedRowKeys,
      });

      if (response.status === 200 || response.status === 204) {
        toast.success("Grades deleted successfully!");
        fetchAllData();
        setSelectedRowKeys([]);
      } else {
        toast.error(response?.data?.message || "Failed to delete grades.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting grades. Please try again.");
    }
  };

  // Upload handler
  const handleUpload = async ({ file }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(UPLOAD_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        if (response.data && response.data.calculatedGrades) {
          toast.success("File uploaded and grades calculated successfully!");
          if (response.data.warnings && response.data.warnings.length > 0) {
            response.data.warnings.forEach(warning => toast.warning(warning));
          }
          fetchAllData();
        } else {
          toast.error("Failed to upload file or no grades were calculated.");
        }
      } else {
        toast.error(response.data?.message || "Failed to upload file with a non-200 response.");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        let errorMessage = "An unknown error occurred during upload.";
        // Check if the response data is a plain string
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        // Check if the response data is an object with a 'message' property
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.statusText) {
          errorMessage = `${err.response.status}: ${err.response.statusText}`;
        }
        toast.error(errorMessage);
      } else if (err.request) {
        toast.error("No response from server. Check your network connection.");
      } else {
        toast.error("Error in request setup.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Manual Insert handler
const handleManualInsert = async (values) => {
  try {
    const response = await axiosInstance.post(MANUAL_INSERT_API, values);

    if (response.status === 200) {
      toast.success("Grade inserted successfully!");
      fetchAllData();
    } else {
      toast.error("Failed to insert grade.");
    }

    setIsManualModalVisible(false);
    manualForm.resetFields();
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Error inserting grade.");
    setIsManualModalVisible(false);
  }
};


  // Table columns
  const columns = [
        {
      title: "Student Number",
      dataIndex: "studentNumber",
      key: "studentNumber",
    },
    {
      title: "Name",
      dataIndex: "studentFullName",
      key: "studentFullName",
    },
    {
      title: "Midterm Grade",
      dataIndex: "totalMidtermGrade",
      key: "totalMidtermGrade",
      render: (grade) =>
        grade >= 75 ? (
          <Tag color="green">{grade}</Tag>
        ) : (
          <Tag color="red">{grade}</Tag>
        ),
    },
    {
      title: "Rounded Grade",
      dataIndex: "totalMidtermGradeRounded",
      key: "totalMidtermGradeRounded",
    },
    {
      title: "Equivalent",
      dataIndex: "gradePointEquivalent",
      key: "gradePointEquivalent",
    },
        {
      title: "AY",
      dataIndex: "academicYear",
      key: "academicYear",
    },
            {
      title: "Semester",
      dataIndex: "semester",
      key: "semester",
    },
                {
      title: "Subject",
      dataIndex: "subjectName",
      key: "subjectName",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedStudent(record);
            setIsViewModalVisible(true);
          }}
        >
          View Grade Sheet
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const chartData = [
    ...(selectedStudent?.quizzes?.map((q) => ({
      name: q.label,
      score: q.quizScore,
      total: q.totalQuizScore,
    })) || []),
    ...(selectedStudent?.classStandingItems?.map((cs) => ({
      name: cs.label,
      score: cs.score,
      total: cs.total,
    })) || []),
  ];

  return (
    <div>
        <Spin spinning={loading} tip="Loading...">
    <div>
      <div style={{ marginBottom: "20px" }}>
        <GradePercentage />
      </div>
          </div>
  </Spin>
      <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          accept=".xls,.xlsx"
        >
          <Button
            type="default"
            icon={<UploadOutlined />}
            loading={uploading}
          >
            Upload Excel
          </Button>
        </Upload>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsManualModalVisible(true)}
        >
          Manual Insert
        </Button>
        <Popconfirm
          title="Are you sure to delete selected grades?"
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
          disabled={selectedRowKeys.length === 0}
        >
          <Button
            type="primary"
            danger
            disabled={selectedRowKeys.length === 0}
          >
            Delete Selected
          </Button>
        </Popconfirm>
      </div>
      <Table
        rowKey="id"
        dataSource={grades}
        columns={columns}
        loading={loading}
        rowSelection={rowSelection}
      />

      <Modal 
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedStudent && (
          <>
            <h3
              style={{
                fontWeight: "bold",
              }}
            >
              <span>Name: </span>{selectedStudent.studentFullName} - Midterm Breakdown
            </h3>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              <span>Subject: </span>{selectedStudent.subjectName}
            </div>
                        <div
              style={{
                fontWeight: "bold",
              }}
            >
              <span>Subject Code: </span>{selectedStudent.subjectCode}
            </div>
                                    <div
              style={{
                marginBottom: 20,
                fontWeight: "bold",
              }}
            >
              <span>Subject Teacher: </span>{selectedStudent.subjectTeacher}
            </div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Quiz Total">
                {selectedStudent.totalQuizScore}
              </Descriptions.Item>
              <Descriptions.Item label="Recitation">
                {selectedStudent.recitationScore}
              </Descriptions.Item>
              <Descriptions.Item label="Attendance">
                {selectedStudent.attendanceScore}
              </Descriptions.Item>
              <Descriptions.Item label="SEP">
                {selectedStudent.sepScore}
              </Descriptions.Item>
              <Descriptions.Item label="Project">
                {selectedStudent.projectScore}
              </Descriptions.Item>
              <Descriptions.Item label="Prelim">
                {selectedStudent.prelimScore} / {selectedStudent.prelimTotal}
              </Descriptions.Item>
              <Descriptions.Item label="Midterm">
                {selectedStudent.midtermScore} /{" "}
                {selectedStudent.midtermTotal}
              </Descriptions.Item>
              <Descriptions.Item label="Final Grade">
                {selectedStudent.totalMidtermGrade >= 75 ? (
                  <Tag color="green">
                    {selectedStudent.totalMidtermGrade} (Pass)
                  </Tag>
                ) : (
                  <Tag color="red">
                    {selectedStudent.totalMidtermGrade} (Fail)
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Equivalent">
                {selectedStudent.gradePointEquivalent}
              </Descriptions.Item>
            </Descriptions>
            {/* Quizzes */}
            <h3 style={{ marginTop: 20 }}>Quizzes</h3>
            <Table
              size="small"
              rowKey="label"
              dataSource={selectedStudent.quizzes || []}
              columns={[
                { title: "Quiz", dataIndex: "label", key: "label" },
                { title: "Score", dataIndex: "quizScore", key: "quizScore" },
                {
                  title: "Total Possible",
                  dataIndex: "totalQuizScore",
                  key: "totalQuizScore",
                },
              ]}
              pagination={false}
            />
            {/* Class Standing */}
            <h3 style={{ marginTop: 20 }}>Class Standing</h3>
            <Table
              size="small"
              rowKey="label"
              dataSource={selectedStudent.classStandingItems || []}
              columns={[
                { title: "Task", dataIndex: "label", key: "label" },
                { title: "Score", dataIndex: "score", key: "score" },
                { title: "Total Possible", dataIndex: "total", key: "total" },
              ]}
              pagination={false}
            />
            {/* Student Performance Graph */}
            <h3 style={{ marginTop: 30 }}>Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#1677ff" name="Student Score" />
                <Bar dataKey="total" fill="#82ca9d" name="Total Possible" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Modal>

      <Modal
        title="Manual Grade Insert"
        open={isManualModalVisible}
        onCancel={() => setIsManualModalVisible(false)}
        okText="Submit"
        onOk={() => manualForm.submit()}
        width={700}
      >
        <Form
          form={manualForm}
          layout="vertical"
          onFinish={handleManualInsert}
        >
          {/* Student Dropdown */}
          <Form.Item
            label="Student"
            name="studentId"
            rules={[{ required: true, message: "Please select a student" }]}
          >
            <Select placeholder="Select a student">
              {students.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.fullname}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* Scores */}
          <Form.Item label="Recitation Score" name="recitationScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Attendance Score" name="attendanceScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="SEP Score" name="sepScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Project Score" name="projectScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Prelim Score" name="prelimScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Prelim Total" name="prelimTotal">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Midterm Score" name="midtermScore">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Midterm Total" name="midtermTotal">
            <Input type="number" />
          </Form.Item>
          {/* Quizzes and Class Standing with Form.List */}
          <h3>Quizzes</h3>
          <Form.List name="quizzes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "10px",
                    }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "label"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing label" }]}
                    >
                      <Input placeholder="Label" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "quizScore"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing score" }]}
                    >
                      <Input type="number" placeholder="Score" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "totalQuizScore"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing total" }]}
                    >
                      <Input type="number" placeholder="Total" />
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ marginTop: "8px" }}
                    />
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Quiz
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <h3>Class Standing</h3>
          <Form.List name="classStandingItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "10px",
                    }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "label"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing label" }]}
                    >
                      <Input placeholder="Label" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "score"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing score" }]}
                    >
                      <Input type="number" placeholder="Score" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "total"]}
                      style={{ flex: 1 }}
                      rules={[{ required: true, message: "Missing total" }]}
                    >
                      <Input type="number" placeholder="Total" />
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ marginTop: "8px" }}
                    />
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Task
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

function MidtermGradesTable() {
  return (
    <MidtermGradesTableContent />
  );
}

export default MidtermGradesTable;