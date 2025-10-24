import { useEffect, useState } from "react";
import { Menu } from "antd";
import { HomeFilled, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import logoImg from "../../src/assets/bcas-logo.png";

const SidebarMenu = ({ collapsed }) => {
  const [fullname, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    const userDetails = localStorage.getItem("userDetails");
    if (userDetails) {
      const parsed = JSON.parse(userDetails);
      setUserName(parsed.fullname);
      setRole(parsed.role);
      setAcademicYear(parsed.academicYear);
      setSemester(parsed.semester);
    }
  }, []);

  // Menu for all roles
  const menuItemsByRole = {
    Student: [
      {
        key: "students",
        icon: <RightOutlined />,
        label: <Link to="/students" style={{ textDecoration: "none" }}>Students</Link>,
      },
      {
        key: "viewing",
        icon: <RightOutlined />,
        label: <Link to="/view-grades" style={{ textDecoration: "none" }}>View Grades</Link>,
      },
    ],
    Teacher: [
      {
        key: "dashboard",
        icon: <HomeFilled />,
        label: <Link to="/main-dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>,
      },
      {
        key: "midterm",
        icon: <RightOutlined />,
        label: <Link to="/midterm" style={{ textDecoration: "none" }}>Student Midterm Grades</Link>,
      },
      {
        key: "finals",
        icon: <RightOutlined />,
        label: <Link to="/finals" style={{ textDecoration: "none" }}>Student Final Grades</Link>,
      },
      // {key: "viewing",icon: <RightOutlined />,label: <Link to="/view-grades">View Grades</Link>},
      // {
      //   key: "students",
      //   icon: <RightOutlined />,
      //   label: <Link to="/students">Student Subjects</Link>,
      // },
      // {
      //   key: "teacherGrading",
      //   icon: <RightOutlined />,
      //   label: <Link to="/teacher-grading">Input Grades</Link>,
      // },
      {
        key: "myStudents",
        icon: <RightOutlined />,
        label: <Link to="/teacher-students" style={{ textDecoration: "none" }} className="no-underline">My Students</Link>,
      },
    ],
    Admin: [
      {
        key: "dashboard",
        icon: <HomeFilled />,
        label: <Link to="/main-dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>,
      },
      {
        key: "subjects",
        icon: <RightOutlined />,
        label: <Link to="/subjects" style={{ textDecoration: "none" }}>Subjects</Link>,
      },
      {
        key: "teachers",
        icon: <RightOutlined />,
        label: <Link to="/teachers">Teachers</Link>,
      },
      {
        key: "students",
        icon: <RightOutlined />,
        label: <Link to="/students">Students</Link>,
      },
      // {
      //   key: "teacherGrading",
      //   icon: <RightOutlined />,
      //   label: <Link to="/teacher-grading">Input Grades</Link>,
      // },
      // {
      //   key: "events",
      //   icon: <RightOutlined />,
      //   label: <Link to="/events">Events</Link>,
      // },
      //       {
      //   key: "midterm",
      //   icon: <RightOutlined />,
      //   label: <Link to="/midterm">Student Midterm Grades</Link>,
      // },
      // {key: "finals",icon: <RightOutlined />,label: <Link to="/finals">Student Final Grades</Link>},
      {key: "viewing",icon: <RightOutlined />,label: <Link to="/view-grades">View Grades</Link>},
    ],
    Superadmin: [
      {
        key: "dashboard",
        icon: <HomeFilled />,
        label: <Link to="/main-dashboard">Dashboard</Link>,
      },
      {
        key: "subjects",
        icon: <RightOutlined />,
        label: <Link to="/subjects">Subjects</Link>,
      },
      {
        key: "teachers",
        icon: <RightOutlined />,
        label: <Link to="/teachers">Teachers</Link>,
      },
      {
        key: "students",
        icon: <RightOutlined />,
        label: <Link to="/students">Students</Link>,
      },
      // {
      //   key: "teacherGrading",
      //   icon: <RightOutlined />,
      //   label: <Link to="/teacher-grading">Input Grades</Link>,
      // },
      // {
      //   key: "events",
      //   icon: <RightOutlined />,
      //   label: <Link to="/events">Events</Link>,
      // },
      // {
      //   key: "midterm",
      //   icon: <RightOutlined />,
      //   label: <Link to="/midterm">Student Midterm Grades</Link>,
      // },
      // {key: "finals",icon: <RightOutlined />,label: <Link to="/finals">Student Final Grades</Link>},
      {
        key: "viewing",
        icon: <RightOutlined />,
        label: <Link to="/view-grades">View Grades</Link>,
      },
    ],
  };

  const items = menuItemsByRole[role] || [];

  return (
    <>
      {/* Logo and Greetings */}
      {!collapsed && (
        <div className="sidebar-top" style={{ textAlign: "center", padding: "16px" }}>
          <img 
            src={logoImg} 
            alt="Logo" 
            style={{ width: "80px", marginBottom: "8px", borderRadius: "8px" }} 
          />
          {fullname && (
            <div className="greeting-container">
              <div className="greeting-content">
                <span>Hello, </span>
                <span className="username">{fullname}.</span>
                <div className="academic-info">
                  AY {academicYear} - {semester} Semester
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Menu
        theme="light"
        mode="inline"
        style={{ minHeight: "auto" }}
        items={items}
        className="no-underline"
      />
    </>
  );
};

export default SidebarMenu;
