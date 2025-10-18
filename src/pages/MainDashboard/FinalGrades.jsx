import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Upload,
  Tag,
  Form,
  InputNumber,
  Spin,
  message,
  Typography,
  Card,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../../api/axiosInstance";
import loginService from "../../../api/loginService";
import GradePercentage from "./Graph/GradePercentage";

const API_URL = "/GradeCalculation/students-finalGrades";
const UPLOAD_API_URL = "/GradeCalculation/upload-finals";
const UPDATE_API_URL = "/FinalsGrade";
const DELETE_API_URL = "/GradeCalculation/delete-finalGrades";
const TEACHER_STUDENTS_API = "/Teachers/my-students";

const { Title } = Typography;

export default function FinalsGradesTableContent() {
  const [grades, setGrades] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [quizCount, setQuizCount] = useState(5);
  const [classStandingCount, setClassStandingCount] = useState(5);

  const academicPeriod = loginService.getAcademicPeriod();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [gradesResp, teacherStudentsResp] = await Promise.all([
        axiosInstance.get(API_URL),
        axiosInstance.get(TEACHER_STUDENTS_API),
      ]);
      setGrades(gradesResp.data?.data || []);
      setTeacherStudents(teacherStudentsResp.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async ({ file }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axiosInstance.post(UPLOAD_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200) {
        toast.success("File uploaded successfully!");
        fetchAllData();
      } else {
        toast.error("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("No students selected for deletion.");
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map((id) =>
          axiosInstance.delete(`${DELETE_API_URL}?studentId=${id}`)
        )
      );
      message.success("Selected grades deleted successfully!");
      setSelectedRowKeys([]);
      fetchAllData();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete selected grades.");
    }
  };

  const addQuizColumn = () => setQuizCount((prev) => prev + 1);
  const addClassStandingColumn = () => setClassStandingCount((prev) => prev + 1);

  const saveAll = async () => {
    try {
      const values = await editForm.validateFields();

      const cleanedData = Object.entries(values).reduce((acc, [id, fields]) => {
        const cleaned = Object.fromEntries(
          Object.entries(fields).filter(
            ([_, v]) => v !== "" && v !== null && v !== undefined
          )
        );
        acc[id] = cleaned;
        return acc;
      }, {});

      const payload = Object.keys(cleanedData)
        .map((key) => {
          const formItem = cleanedData[key];
          const existingStudent = grades.find((g) => g.id === parseInt(key));
          if (!existingStudent) return null;

          return {
            id: existingStudent.id,
            studentId: existingStudent.studentId,
            studentNumber: existingStudent.studentNumber,
            studentFullName: existingStudent.studentFullName,
            subjectId: existingStudent.subjectId,
            subjectCode: existingStudent.subjectCode,
            subjectName: existingStudent.subjectName,
            department: existingStudent.department,
            semester: existingStudent.semester,
            academicYear: existingStudent.academicYear,
            academicPeriodId: existingStudent.academicPeriodId,
            attendanceScore:
              formItem.attendanceScore ?? existingStudent.attendanceScore,
            recitationScore:
              formItem.recitationScore ?? existingStudent.recitationScore,
            projectScore:
              formItem.projectScore ?? existingStudent.projectScore,
            sepScore:
              existingStudent.department?.toUpperCase() === "BSED"
                ? formItem.sepScore ?? existingStudent.sepScore
                : 0,
            finalsScore: formItem.finalsScore ?? existingStudent.finalsScore,
            finalsTotal: formItem.finalsTotal ?? existingStudent.finalsTotal,
            quizzes: Object.entries(formItem)
              .filter(([key, val]) => key.startsWith("quiz") && val?.quizScore)
              .map(([key, val]) => ({
                label: key,
                quizScore: val.quizScore,
                totalQuizScore: val.totalQuizScore,
              })),
            classStandingItems: Object.entries(formItem)
              .filter(([key, val]) => key.startsWith("classStanding") && val?.score)
              .map(([key, val]) => ({
                label: key,
                score: val.score,
                total: val.total,
              })),
          };
        })
        .filter(Boolean);

      for (const record of payload) {
        await axiosInstance.put(`${UPDATE_API_URL}/${record.id}`, record);
      }

      message.success("✅ All finals grades saved successfully!");
    } catch (err) {
      console.error(err);
      message.error("❌ Failed to save grades.");
    }
  };

  // Group by subject
  const subjects = [...new Set(grades.map((g) => g.subjectName))];

  const renderTableForSubject = (subjectName) => {
    const subjectGrades = grades.filter((g) => g.subjectName === subjectName);
    const isBSED = subjectGrades.some(
      (g) => g.department?.toUpperCase() === "BSED"
    );

    const columns = [
      {
        title: "Student #",
        dataIndex: "studentNumber",
        fixed: "left",
        width: 120,
      },
      {
        title: "Name",
        dataIndex: "studentFullName",
        fixed: "left",
        width: 200,
      },
      // 🧮 Quizzes
      ...Array.from({ length: quizCount }, (_, i) => ({
        title: `Quiz ${i + 1}`,
        render: (_, record) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Form.Item
              name={[record.id, `quiz${i + 1}`, "quizScore"]}
              initialValue={record.quizzes?.[i]?.quizScore ?? undefined}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
            </Form.Item>
            /
            <Form.Item
              name={[record.id, `quiz${i + 1}`, "totalQuizScore"]}
              initialValue={record.quizzes?.[i]?.totalQuizScore ?? undefined}
              style={{ margin: 0 }}
            >
              <InputNumber min={1} style={{ width: 60 }} placeholder="Total" />
            </Form.Item>
          </div>
        ),
      })),
      // 🧮 Class Standing
      ...Array.from({ length: classStandingCount }, (_, i) => ({
        title: `Class Standing ${i + 1}`,
        render: (_, record) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Form.Item
              name={[record.id, `classStanding${i + 1}`, "score"]}
              initialValue={record.classStandingItems?.[i]?.score ?? undefined}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
            </Form.Item>
            /
            <Form.Item
              name={[record.id, `classStanding${i + 1}`, "total"]}
              initialValue={record.classStandingItems?.[i]?.total ?? undefined}
              style={{ margin: 0 }}
            >
              <InputNumber min={1} style={{ width: 60 }} placeholder="Total" />
            </Form.Item>
          </div>
        ),
      })),
      ...[
        "recitationScore",
        "attendanceScore",
        "projectScore",
        ...(isBSED ? ["sepScore"] : []),
        "finalsScore",
        "finalsTotal",
      ].map((field) => ({
        title: field,
        key: field,
        render: (_, record) => (
          <Form.Item
            name={[record.id, field]}
            initialValue={record[field] ?? undefined}
            style={{ margin: 0 }}
          >
            <InputNumber min={0} step={0.01} style={{ width: 90 }} placeholder={field} />
          </Form.Item>
        ),
      })),
      {
        title: "Total Grade",
        dataIndex: "totalFinalsGrade",
        key: "totalFinalsGrade",
        fixed: "right",
        width: 120,
        render: (grade) =>
          grade >= 75 ? (
            <Tag color="green">{grade}</Tag>
          ) : (
            <Tag color="red">{grade}</Tag>
          ),
      },
    ];

    return (
      <Card
        key={subjectName}
        title={<Title level={4}>{subjectName}</Title>}
        style={{
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          borderRadius: 8,
        }}
      >
        <Form form={editForm} component={false}>
          <Table
            bordered
            rowKey="id"
            dataSource={subjectGrades}
            columns={columns}
            pagination={false}
            scroll={{ x: 4000, y: 500 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
          />
        </Form>
      </Card>
    );
  };

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 20 }}>
        <GradePercentage />
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Upload customRequest={handleUpload} showUploadList={false} accept=".xls,.xlsx">
          <Button icon={<UploadOutlined />} loading={uploading}>
            Upload Excel
          </Button>
        </Upload>

        <Button type="primary" icon={<SaveOutlined />} onClick={saveAll}>
          Save All Scores
        </Button>

        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Delete Selected
        </Button>

        <Button icon={<PlusOutlined />} onClick={addQuizColumn}>
          + Add Quiz
        </Button>

        <Button icon={<PlusOutlined />} onClick={addClassStandingColumn}>
          + Add Class Standing
        </Button>
      </div>

      <h5>
        AY {academicPeriod.academicYear} - {academicPeriod.semester} Semester Finals
      </h5>

      {subjects.map((subjectName) => renderTableForSubject(subjectName))}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Spin>
  );
}
