import { useEffect, useState } from "react";
import { Menu } from "antd";
import { HomeFilled, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import logoImg from "../../src/assets/bcas-logo.png";

const SidebarMenu = ({ collapsed, onMenuSelect  }) => {
  const [fullname, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  

  useEffect(() => {
    // Get user info from localStorage
    const userDetails = localStorage.getItem("userDetails");
    if (userDetails) {
      const parsed = JSON.parse(userDetails);
      setUserName(parsed.fullname);
      setRole(parsed.role);
    }

    // Fetch current academic period from API
    const fetchAcademicPeriod = async () => {
      try {
        const response = await fetch("https://localhost:7255/api/AcademicPeriods/current", {
          method: "GET",
          headers: {
            accept: "*/*"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch academic period");

        const data = await response.json();
        setAcademicYear(data.academicYear); // "2025-2026"
        setSemester(data.semester);         // "Second"
      } catch (err) {
        console.error("Error fetching academic period:", err);
      }
    };

    fetchAcademicPeriod();
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
      {
        key: "viewing",
        icon: <RightOutlined />,
        label: <Link to="/view-grades">View Grades</Link>,
      },
            {
        key: "academicPeriods",
        icon: <RightOutlined />,
        label: <Link to="/academic-periods">Academic Periods</Link>,
      },
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
        onClick={onMenuSelect}
      />
    </>
  );
};

export default SidebarMenu;
