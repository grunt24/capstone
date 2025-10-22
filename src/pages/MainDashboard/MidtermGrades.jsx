import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  InputNumber,
  Spin,
  message,
  Typography,
  Card,
  Tag,
} from "antd";
import { SaveOutlined, PlusOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GradePercentage from "./Graph/GradePercentage";
import axiosInstance from "../../../api/axiosInstance";
import loginService from "../../../api/loginService";

const API_URL = "/GradeCalculation/students-midtermGrades";
const UPDATE_API_URL = "/GradeCalculation";
const { Title } = Typography;

export default function MidtermGradesTableContent() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [quizCount, setQuizCount] = useState(5);
  const [classStandingCount, setClassStandingCount] = useState(5);

  // 🟢 Now per-subject totals (instead of global)
  const [subjectTotals, setSubjectTotals] = useState({});

  const academicPeriod = loginService.getAcademicPeriod();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const gradesResp = await axiosInstance.get(API_URL);
      const fetchedGrades = gradesResp.data?.data || [];
      setGrades(fetchedGrades);

      // Initialize per-subject totals
      const totalsBySubject = {};

      fetchedGrades.forEach((g) => {
        const subj = g.subjectName;

        if (!totalsBySubject[subj]) {
          totalsBySubject[subj] = {
            quizTotals: {},
            classStandingTotals: {},
            prelimTotal: g.prelimTotal || 0,
            midtermTotal: g.midtermTotal || 0,
          };
        }

        (g.quizzes || []).forEach((q, idx) => {
          totalsBySubject[subj].quizTotals[idx + 1] =
            q.totalQuizScore || totalsBySubject[subj].quizTotals[idx + 1] || 0;
        });

        (g.classStandingItems || []).forEach((c, idx) => {
          totalsBySubject[subj].classStandingTotals[idx + 1] =
            c.total || totalsBySubject[subj].classStandingTotals[idx + 1] || 0;
        });
      });

      setSubjectTotals(totalsBySubject);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const addQuizColumn = () => setQuizCount((prev) => prev + 1);
  const addClassStandingColumn = () => setClassStandingCount((prev) => prev + 1);

  const saveAll = async () => {
    try {
      setSaving(true);
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

          const subjTotals = subjectTotals[existingStudent.subjectName] || {
            quizTotals: {},
            classStandingTotals: {},
            prelimTotal: 0,
            midtermTotal: 0,
          };

          return {
            ...existingStudent,
            attendanceScore:
              formItem.attendanceScore ?? existingStudent.attendanceScore,
            recitationScore:
              formItem.recitationScore ?? existingStudent.recitationScore,
            projectScore: formItem.projectScore ?? existingStudent.projectScore,
            sepScore:
              existingStudent.department?.toUpperCase() === "BSED"
                ? formItem.sepScore ?? existingStudent.sepScore
                : 0,
            prelimScore: formItem.prelimScore ?? existingStudent.prelimScore,
            midtermScore: formItem.midtermScore ?? existingStudent.midtermScore,
            quizzes: Object.entries(formItem)
              .filter(([key, val]) => key.startsWith("quiz") && val?.quizScore !== undefined)
              .map(([key, val]) => {
                const quizIndex = parseInt(key.replace("quiz", ""));
                return {
                  label: key,
                  quizScore: val.quizScore,
                  totalQuizScore:
                    subjTotals.quizTotals[quizIndex] ||
                    val.totalQuizScore ||
                    0,
                };
              }),
            classStandingItems: Object.entries(formItem)
              .filter(([key, val]) => key.startsWith("classStanding") && val?.score !== undefined)
              .map(([key, val]) => {
                const index = parseInt(key.replace("classStanding", ""));
                return {
                  label: key,
                  score: val.score,
                  total:
                    subjTotals.classStandingTotals[index] ||
                    val.total ||
                    0,
                };
              }),
            prelimTotal:
              subjTotals.prelimTotal || existingStudent.prelimTotal,
            midtermTotal:
              subjTotals.midtermTotal || existingStudent.midtermTotal,
          };
        })
        .filter(Boolean);

      for (const record of payload) {
        await axiosInstance.put(`${UPDATE_API_URL}/${record.id}`, record);
      }

      message.success("✅ All midterm grades saved successfully!");
    } catch (err) {
      console.error(err);
      message.error("❌ Failed to save grades.");
    } finally {
      setSaving(false);
    }
  };

  const subjects = [...new Set(grades.map((g) => g.subjectName))];

  const renderTableForSubject = (subjectName) => {
    const subjectGrades = grades.filter((g) => g.subjectName === subjectName);
    const isBSED = subjectGrades.some(
      (g) => g.department?.toUpperCase() === "BSED"
    );

    const totals = subjectTotals[subjectName] || {
      quizTotals: {},
      classStandingTotals: {},
      prelimTotal: 0,
      midtermTotal: 0,
    };

    const updateTotals = (field, index, val) => {
      setSubjectTotals((prev) => ({
        ...prev,
        [subjectName]: {
          ...prev[subjectName],
          [field]: {
            ...prev[subjectName]?.[field],
            [index]: val,
          },
        },
      }));
    };

    const updateSingleTotal = (key, val) => {
      setSubjectTotals((prev) => ({
        ...prev,
        [subjectName]: {
          ...prev[subjectName],
          [key]: val,
        },
      }));
    };

    const columns = [
      {
        title: "Student #",
        dataIndex: "studentNumber",
        key: "studentNumber",
        width: 120,
        fixed: "left",
      },
      {
        title: "Name",
        dataIndex: "studentFullName",
        key: "studentFullName",
        width: 200,
        fixed: "left",
      },
      // Quizzes
      ...Array.from({ length: quizCount }, (_, i) => ({
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>{`Quiz ${i + 1}`}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span>Total:</span>
              <InputNumber
                min={1}
                value={totals.quizTotals[i + 1] || ""}
                onChange={(val) => updateTotals("quizTotals", i + 1, val)}
                style={{ width: 70 }}
                placeholder="Total"
              />
            </div>
          </div>
        ),
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Form.Item
              name={[record.id, `quiz${i + 1}`, "quizScore"]}
              initialValue={record.quizzes?.[i]?.quizScore}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
            </Form.Item>
            {totals.quizTotals[i + 1] ? <span>/ {totals.quizTotals[i + 1]}</span> : null}
          </div>
        ),
      })),

      // Class Standing
      ...Array.from({ length: classStandingCount }, (_, i) => ({
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>{`Class Standing ${i + 1}`}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span>Total:</span>
              <InputNumber
                min={1}
                value={totals.classStandingTotals[i + 1] || ""}
                onChange={(val) => updateTotals("classStandingTotals", i + 1, val)}
                style={{ width: 70 }}
                placeholder="Total"
              />
            </div>
          </div>
        ),
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Form.Item
              name={[record.id, `classStanding${i + 1}`, "score"]}
              initialValue={record.classStandingItems?.[i]?.score}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
            </Form.Item>
            {totals.classStandingTotals[i + 1] ? (
              <span>/ {totals.classStandingTotals[i + 1]}</span>
            ) : null}
          </div>
        ),
      })),

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

      // Prelim Total
      {
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>Prelim Total</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span>Total:</span>
              <InputNumber
                min={1}
                value={totals.prelimTotal || ""}
                onChange={(val) => updateSingleTotal("prelimTotal", val)}
                style={{ width: 80 }}
                placeholder="Total"
              />
            </div>
          </div>
        ),
        key: "prelimTotal",
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Form.Item
              name={[record.id, "prelimScore"]}
              initialValue={record.prelimScore}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 80 }} placeholder="Score" />
            </Form.Item>
            {totals.prelimTotal ? <span>/ {totals.prelimTotal}</span> : null}
          </div>
        ),
      },

      // Midterm Total
      {
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>Midterm Total</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span>Total:</span>
              <InputNumber
                min={1}
                value={totals.midtermTotal || ""}
                onChange={(val) => updateSingleTotal("midtermTotal", val)}
                style={{ width: 80 }}
                placeholder="Total"
              />
            </div>
          </div>
        ),
        key: "midtermTotal",
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Form.Item
              name={[record.id, "midtermScore"]}
              initialValue={record.midtermScore}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 80 }} placeholder="Score" />
            </Form.Item>
            {totals.midtermTotal ? <span>/ {totals.midtermTotal}</span> : null}
          </div>
        ),
      },

      {
        title: "Total Grade",
        dataIndex: "totalMidtermGrade",
        key: "totalMidtermGrade",
        width: 120,
        fixed: "right",
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
    <Spin spinning={loading || saving} tip={saving ? "Saving..." : "Loading..."}>
      <div style={{ marginBottom: 20 }}>
        <GradePercentage />
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveAll} loading={saving}>
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
        AY {academicPeriod.academicYear} - {academicPeriod.semester} Semester Midterm
      </h5>

      {subjects.map((subjectName) => renderTableForSubject(subjectName))}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Spin>
  );
}
