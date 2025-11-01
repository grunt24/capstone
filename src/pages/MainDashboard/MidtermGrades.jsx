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
  Divider,
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
  const [quizCountBySubject, setQuizCountBySubject] = useState({});
  const [classStandingCountBySubject, setClassStandingCountBySubject] = useState({});
  const [subjectTotals, setSubjectTotals] = useState({});
   const academicPeriod = loginService.getAcademicPeriod(); // get academic period info
  const academicPeriodId = academicPeriod?.academicYearId; // ID for API
  const academicYear = academicPeriod?.academicYear; // ID for API
  const semester = academicPeriod?.semester; // ID for API
    const [calculating, setCalculating] = useState(false);
    const [selectedAY, setSelectedAY] = useState(null);

    const [selectedSemester, setSelectedSemester] = useState(null);

const handleCalculateGrades = async (type) => {
  setCalculating(true);
  try {
    if (type === "midterm") {
      await axiosInstance.post("/GradeCalculation/calculate-midterm-all");
    } else if (type === "finals") {
      await axiosInstance.post("/GradeCalculation/calculate-finals-all");
    }

    message.success(
      `${type === "midterm" ? "Midterm" : "Finals"} grades calculated successfully.`
    );

    // ✅ Refresh data after calculation
    await fetchAllData();

  } catch (err) {
    console.error(err);
    message.error("Failed to calculate grades.");
  } finally {
    setCalculating(false);
  }
};

useEffect(() => {
  if (academicPeriod) {
    setSelectedAY(academicPeriod.academicYear);
    setSelectedSemester(academicPeriod.semester);
  }
}, [academicPeriod]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const gradesResp = await axiosInstance.get(API_URL);
      const fetchedGrades = gradesResp.data?.data || [];
      setGrades(fetchedGrades);

      // Initialize counts
      const quizCounts = {};
      const csCounts = {};
      const totalsBySubject = {};

      fetchedGrades.forEach((g) => {
        if (!quizCounts[g.subjectName]) quizCounts[g.subjectName] = 5;
        if (!csCounts[g.subjectName]) csCounts[g.subjectName] = 5;

        if (!totalsBySubject[g.subjectName]) {
          totalsBySubject[g.subjectName] = {
            quizTotals: {},
            classStandingTotals: {},
            prelimTotal: g.prelimTotal || 0,
            midtermTotal: g.midtermTotal || 0,
          };
        }

        (g.quizzes || []).forEach((q, idx) => {
          totalsBySubject[g.subjectName].quizTotals[idx + 1] =
            q.totalQuizScore || 0;
        });

        (g.classStandingItems || []).forEach((c, idx) => {
          totalsBySubject[g.subjectName].classStandingTotals[idx + 1] =
            c.total || 0;
        });
      });

      setQuizCountBySubject(quizCounts);
      setClassStandingCountBySubject(csCounts);
      setSubjectTotals(totalsBySubject);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

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

                  const prelimTotal = subjTotals.prelimTotal;
        const midtermTotal = subjTotals.midtermTotal;

          return {
            ...existingStudent,
            academicPeriodId, 
            academicYear, 
            semester, 

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

                      prelimTotal,
          midtermTotal,


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

    const quizCount = quizCountBySubject[subjectName] || 3;
    const csCount = classStandingCountBySubject[subjectName] || 3;
    const totals = subjectTotals[subjectName] || {
      quizTotals: {},
      classStandingTotals: {},
    };

const updateTotals = (field, index, val) => {
  setSubjectTotals((prev) => {
    const currentSubject = prev[subjectName] || {
      quizTotals: {},
      classStandingTotals: {},
      prelimTotal: 0,
      midtermTotal: 0,
    };

    // Handle direct totals (prelimTotal, midtermTotal)
    if (field === "prelimTotal" || field === "midtermTotal") {
      return {
        ...prev,
        [subjectName]: {
          ...currentSubject,
          [field]: val || 0,
        },
      };
    }

    // Handle nested totals (quizTotals, classStandingTotals)
    return {
      ...prev,
      [subjectName]: {
        ...currentSubject,
        [field]: {
          ...currentSubject[field],
          [index]: val || 0,
        },
      },
    };
  });
};


    const addQuizColumn = () => {
      setQuizCountBySubject((prev) => ({
        ...prev,
        [subjectName]: (prev[subjectName] || 3) + 1,
      }));
    };

    const addClassStandingColumn = () => {
      setClassStandingCountBySubject((prev) => ({
        ...prev,
        [subjectName]: (prev[subjectName] || 3) + 1,
      }));
    };

const quizColumns = Array.from({ length: quizCount }, (_, i) => ({
  title: `Q${i + 1}`,
    align: "center",
  children: [
    {
      title: (
        <InputNumber
          min={1}
          value={totals.quizTotals[i + 1] || ""}
          onChange={(val) => updateTotals("quizTotals", i + 1, val)}
          style={{ width: 70 }}
          placeholder="Total"
        />
      ),
        align: "center",
      render: (_, record) => (
        <Form.Item
          name={[record.id, `quiz${i + 1}`, "quizScore"]}
          initialValue={record.quizzes?.[i]?.quizScore}
          style={{ margin: 0 }}
        >
          <InputNumber min={0} style={{ width: 60, textAlign: "center" }} placeholder="Score" />
        </Form.Item>
      ),
    },
  ],
}));

    const classStandingColumns = Array.from({ length: csCount }, (_, i) => ({
      title: `CS${i + 1}`,
      children: [
        {
          title: (
            <InputNumber
              min={1}
              value={totals.classStandingTotals[i + 1] || ""}
              onChange={(val) => updateTotals("classStandingTotals", i + 1, val)}
              style={{ width: 70 }}
              placeholder="Total"
            />
          ),
          render: (_, record) => (
            <Form.Item
              name={[record.id, `classStanding${i + 1}`, "score"]}
              initialValue={record.classStandingItems?.[i]?.score}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 60 }} placeholder="Score" />
            </Form.Item>
          ),
        },
      ],
    }));

const calculateOverallTotal = (data, key) => {
  return data.reduce((sum, record) => {
    const total = (record[key] || []).reduce(
      (s, item) => s + (item.score || 0),
      0
    );
    return sum + total;
  }, 0);
};


const columns = [
  { title: "Student #", dataIndex: "studentNumber", key: "studentNumber" },
  { title: "Name", dataIndex: "studentFullName", key: "studentFullName",fixed: "left", },
  { title: "QUIZZES", children: quizColumns },
{
  title: (
    <div>
      <Button icon={<PlusOutlined />} size="small" onClick={addQuizColumn}>
        Add Quiz
      </Button>
    </div>
  ),
    align: "center",
  children: [
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Total Quiz</div>
          <div>
            <Tag color="green" style={{ fontWeight: 600, marginLeft: 6 }}>
              OTQ:{" "}
              {Object.values(totals.quizTotals || {}).reduce(
                (sum, val) => sum + (Number(val) || 0),
                0
              )}
            </Tag>
          </div>
        </div>
      ),
          align: "center",
      render: (_, record) => {
        const total = (record.quizzes || []).reduce(
          (sum, q) => sum + (q.quizScore || 0),
          0
        );
        return <Tag color="blue">{total}</Tag>;
      },
    },
  ],
},

  { title: "CLASS STANDING", children: classStandingColumns },
{
  title: (
    <Button
      icon={<PlusOutlined />}
      size="small"
      onClick={addClassStandingColumn}
    >
      Add Class Standing
    </Button>
  ),
  children: [
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Total CS</div>
          <div>
            <Tag color="green" style={{ fontWeight: 600, marginLeft: 6 }}>
              OCS:{" "}
              {Object.values(totals.classStandingTotals || {}).reduce(
                (sum, val) => sum + (Number(val) || 0),
                0
              )}
            </Tag>
          </div>
        </div>
      ),
      render: (_, record) => {
        const total = (record.classStandingItems || []).reduce(
          (sum, cs) => sum + (cs.score || 0),
          0
        );
        return <Tag color="purple">{total}</Tag>;
      },
    },
  ],
},

    {
    title: "Recitation",
    render: (_, record) => (
      <Form.Item
        name={[record.id, "recitationScore"]}
        initialValue={record.recitationScore}
        style={{ margin: 0 }}
      >
        <InputNumber min={0} style={{ width: 70 }} />
      </Form.Item>
    ),
  },
  {
    title: "Attendance",
    render: (_, record) => (
      <Form.Item
        name={[record.id, "attendanceScore"]}
        initialValue={record.attendanceScore}
        style={{ margin: 0 }}
      >
        <InputNumber min={0} style={{ width: 70 }} />
      </Form.Item>
    ),
  },
  ...(isBSED
    ? [
        {
          title: "SEP",
          render: (_, record) => (
            <Form.Item
              name={[record.id, "sepScore"]}
              initialValue={record.sepScore}
              style={{ margin: 0 }}
            >
              <InputNumber min={0} style={{ width: 70 }} />
            </Form.Item>
          ),
        },
      ]
    : []),
  {
    title: "Project",
    render: (_, record) => (
      <Form.Item
        name={[record.id, "projectScore"]}
        initialValue={record.projectScore}
        style={{ margin: 0 }}
      >
        <InputNumber min={0} style={{ width: 70 }} />
      </Form.Item>
    ),
  },
{
  title: "Prelim",
  children: [
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Prelim Total</div>
          <InputNumber
            min={0}
            value={totals.prelimTotal || 0}
            onChange={(val) => updateTotals("prelimTotal", null, val)}
            style={{ width: 70 }}
          />
        </div>
      ),
      render: (_, record) => (
        <Form.Item
          name={[record.id, "prelimScore"]}
          initialValue={record.prelimScore}
          style={{ margin: 0 }}
        >
          <InputNumber min={0} style={{ width: 70 }} />
        </Form.Item>
      ),
    },
  ],
},
{
  title: "Midterm",
  children: [
    {
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Midterm Total</div>
          <InputNumber
            min={0}
            value={totals.midtermTotal || 0}
            onChange={(val) => updateTotals("midtermTotal", null, val)}
            style={{ width: 70 }}
          />
        </div>
      ),
      render: (_, record) => (
        <Form.Item
          name={[record.id, "midtermScore"]}
          initialValue={record.midtermScore}
          style={{ margin: 0 }}
        >
          <InputNumber min={0} style={{ width: 70 }} />
        </Form.Item>
      ),
    },
  ],
},

{
  title: (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: "bold" }}>Total Score</div>
      <Tag color="green" style={{ fontWeight: 600, marginTop: 4 }}>
        TS: {(totals.prelimTotal || 0) + (totals.midtermTotal || 0)}
      </Tag>
    </div>
  ),
  render: (_, record) => {
    const prelim = record.prelimScore || 0;
    const midterm = record.midtermScore || 0;
    const total = prelim + midterm;
    return (
      <Tag color="purple" style={{ fontWeight: 600 }}>
        {total}
      </Tag>
    );
  },
},


  { title: "Midterm Grade", dataIndex: "totalMidtermGrade", key: "totalMidtermGrade",fixed: "right", },
  { title: "Equivalent", dataIndex: "gradePointEquivalent", key: "gradePointEquivalent",fixed: "right", },

];


    return (
      <Card
        key={subjectName}
        title={
          <Title level={4} style={{ margin: 0 }}>
            {subjectName}
          </Title>
        }
        style={{ marginBottom: 32 }}
      >
        <Form form={editForm} component={false}>
          <Table
            bordered
            rowKey="id"
            dataSource={subjectGrades}
  columns={columns.map(col => ({ ...col, align: "center" }))}
            pagination={false}
            scroll={{ x: 3000, y: 500 }}
            style={{ textAlign: "center" }}
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

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveAll}
          loading={saving}
        >
          Save All Scores
        </Button>
                      <Button
                        type="primary"
                        loading={calculating}
                        onClick={() => handleCalculateGrades("midterm")}
                      >
                        Calculate Midterm
                      </Button>
                      <Button
                        type="primary"
                        loading={calculating}
                        onClick={() => handleCalculateGrades("finals")}
                      >
                        Calculate Finals
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
