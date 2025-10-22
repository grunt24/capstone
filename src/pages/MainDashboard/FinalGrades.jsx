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
const [quizTotals, setQuizTotals] = useState({});
const [classStandingTotals, setClassStandingTotals] = useState({});
const [finalsTotals, setFinalsTotals] = useState({});


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
  useEffect(() => {
  if (grades.length) {
    const quizMap = {};
    const csMap = {};
    const finalsMap = {};

    grades.forEach((g) => {
      const subj = g.subjectName;
      if (!quizMap[subj]) quizMap[subj] = {};
      if (!csMap[subj]) csMap[subj] = {};

      // ✅ Preload quiz totals
      g.quizzes?.forEach((q) => {
        if (q.label && q.totalQuizScore !== undefined) {
          quizMap[subj][q.label] = q.totalQuizScore;
        }
      });

      // ✅ Preload class standing totals
      g.classStandingItems?.forEach((cs) => {
        if (cs.label && cs.total !== undefined) {
          csMap[subj][cs.label] = cs.total;
        }
      });

      // ✅ Preload finals total
      if (g.finalsTotal !== undefined && g.finalsTotal !== null) {
        finalsMap[subj] = g.finalsTotal;
      }
    });

    // ✅ Save totals to state
    setQuizTotals(quizMap);
    setClassStandingTotals(csMap);
    setFinalsTotals(finalsMap);
  }
}, [grades]);


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
    setLoading(true);
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

        const subjectName = existingStudent.subjectName;

        // ✅ Ensure totals are read from current state (shared totals per subject)
        const subjTotals = {
          quizTotals: quizTotals[subjectName] || {},
          classStandingTotals: classStandingTotals[subjectName] || {},
          finalsTotal:
            finalsTotals[subjectName] ??
            existingStudent.finalsTotal ??
            0,
        };

        // 🧩 Create the payload per student
        return {
          ...existingStudent,

          attendanceScore:
            formItem.attendanceScore ?? existingStudent.attendanceScore ?? 0,
          recitationScore:
            formItem.recitationScore ?? existingStudent.recitationScore ?? 0,
          projectScore:
            formItem.projectScore ?? existingStudent.projectScore ?? 0,
          sepScore:
            existingStudent.department?.toUpperCase() === "BSED"
              ? formItem.sepScore ?? existingStudent.sepScore ?? 0
              : 0,

          finalsScore: formItem.finalsScore ?? existingStudent.finalsScore ?? 0,
          finalsTotal: subjTotals.finalsTotal, // ✅ this now saves correctly!

          // 🧮 Save quizzes with correct totals
          quizzes: Object.entries(formItem)
            .filter(([key, val]) => key.startsWith("quiz") && val?.quizScore !== undefined)
            .map(([key, val]) => {
              const quizIndex = key;
              const totalFromState =
                subjTotals.quizTotals?.[quizIndex] ??
                val.totalQuizScore ??
                0;

              return {
                label: key,
                quizScore: val.quizScore,
                totalQuizScore: totalFromState, // ✅ now saved from shared total
              };
            }),

          // 🧾 Save class standing with correct totals
          classStandingItems: Object.entries(formItem)
            .filter(([key, val]) => key.startsWith("classStanding") && val?.score !== undefined)
            .map(([key, val]) => {
              const csIndex = key;
              const totalFromState =
                subjTotals.classStandingTotals?.[csIndex] ??
                val.total ??
                0;

              return {
                label: key,
                score: val.score,
                total: totalFromState, // ✅ now saved from shared total
              };
            }),
        };
      })
      .filter(Boolean);

    // 💾 Save each record
    for (const record of payload) {
      await axiosInstance.put(`${UPDATE_API_URL}/${record.id}`, record);
    }

    message.success("✅ All finals grades saved successfully!");
  } catch (err) {
    console.error("Save failed:", err);
    message.error("❌ Failed to save grades.");
  } finally {
    setLoading(false);
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
// 🧮 Quizzes (shared total per subject, student total disabled)
...Array.from({ length: quizCount }, (_, i) => {
  const quizKey = `quiz${i + 1}`;
  const totalForThisQuiz =
    quizTotals[subjectName]?.[quizKey] ??
    subjectGrades[0]?.quizzes?.[i]?.totalQuizScore ??
    undefined;

  return {
    title: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span>{`Quiz ${i + 1}`}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span>Total:</span>
          <InputNumber
            min={1}
            value={totalForThisQuiz}
            onChange={(val) => {
              if (typeof val !== "number" || isNaN(val)) return; // ensure numeric only
              setQuizTotals((prev) => ({
                ...prev,
                [subjectName]: {
                  ...prev[subjectName],
                  [quizKey]: val,
                },
              }));
              // Update all students’ total field
              subjectGrades.forEach((record) => {
                editForm.setFieldValue([record.id, quizKey, "totalQuizScore"], val);
              });
            }}
            style={{ width: 70 }}
            placeholder="Total"
          />
        </div>
      </div>
    ),
    render: (_, record) => (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Form.Item
          name={[record.id, quizKey, "quizScore"]}
          initialValue={record.quizzes?.[i]?.quizScore ?? undefined}
          style={{ margin: 0 }}
        >
          <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
        </Form.Item>
        {totalForThisQuiz ? <span>/ {totalForThisQuiz}</span> : null}
      </div>
    ),
  };
}),


// 🧾 Class Standing (shared total per subject, student total disabled)
...Array.from({ length: classStandingCount }, (_, i) => {
  const csKey = `classStanding${i + 1}`;
  const totalForThisCS =
    classStandingTotals[subjectName]?.[csKey] ??
    subjectGrades[0]?.classStandingItems?.[i]?.total ??
    undefined;

  return {
    title: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span>{`Group Act ${i + 1}`}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span>Total:</span>
          <InputNumber
            min={1}
            value={totalForThisCS}
            onChange={(val) => {
              if (typeof val !== "number" || isNaN(val)) return;
              setClassStandingTotals((prev) => ({
                ...prev,
                [subjectName]: {
                  ...prev[subjectName],
                  [csKey]: val,
                },
              }));
              subjectGrades.forEach((record) => {
                editForm.setFieldValue([record.id, csKey, "total"], val);
              });
            }}
            style={{ width: 70 }}
            placeholder="Total"
          />
        </div>
      </div>
    ),
    render: (_, record) => (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Form.Item
          name={[record.id, csKey, "score"]}
          initialValue={record.classStandingItems?.[i]?.score ?? undefined}
          style={{ margin: 0 }}
        >
          <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
        </Form.Item>
        {totalForThisCS ? <span>/ {totalForThisCS}</span> : null}
      </div>
    ),
  };
}),


// 🎓 Finals Total (shared per subject, student total disabled)
{
  title: (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span>Finals Total</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        <span>Total:</span>
        <InputNumber
          min={1}
          value={
            finalsTotals[subjectName] ??
            subjectGrades[0]?.finalsTotal ??
            undefined
          }
          onChange={(val) => {
            if (typeof val !== "number" || isNaN(val)) return;
            setFinalsTotals((prev) => ({
              ...prev,
              [subjectName]: val,
            }));
            subjectGrades.forEach((record) => {
              editForm.setFieldValue([record.id, "finalsTotal"], val);
            });
          }}
          style={{ width: 80 }}
          placeholder="Total"
        />
      </div>
    </div>
  ),
  key: "finalsTotal",
  render: (_, record) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Form.Item
        name={[record.id, "finalsScore"]}
        initialValue={record.finalsScore ?? undefined}
        style={{ margin: 0 }}
      >
        <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
      </Form.Item>
      {finalsTotals[subjectName] ? <span>/ {finalsTotals[subjectName]}</span> : null}
    </div>
  ),
},

      // Other Scores
      ...[
        "recitationScore",
        "attendanceScore",
        "projectScore",
        ...(isBSED ? ["sepScore"] : []),
      ].map((field) => ({
        title: field,
        key: field,
        render: (_, record) => (
          <Form.Item
            name={[record.id, field]}
            initialValue={record[field]}
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
            // rowSelection={{
            //   selectedRowKeys,
            //   onChange: (keys) => setSelectedRowKeys(keys),
            // }}
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
        {/* <Upload customRequest={handleUpload} showUploadList={false} accept=".xls,.xlsx">
          <Button icon={<UploadOutlined />} loading={uploading}>
            Upload Excel
          </Button>
        </Upload> */}

        <Button type="primary" icon={<SaveOutlined />} onClick={saveAll}>
          Save All Scores
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
