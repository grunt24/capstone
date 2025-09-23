import { useEffect, useState } from "react";
import { Menu } from "antd";
import { HomeFilled, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const SidebarMenu = ({ collapsed }) => {
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const userDetails = localStorage.getItem("userDetails");
    if (userDetails) {
      const parsed = JSON.parse(userDetails);
      setUserName(parsed.userName);
      setRole(parsed.role);
    }
  }, []);

  // Menu for all roles
  const menuItemsByRole = {
    Student: [
      {
        key: "students",
        icon: <RightOutlined />,
        label: <Link to="/students">Students</Link>,
      },
    ],
    Teacher: [
      {
        key: "dashboard",
        icon: <HomeFilled />,
        label: <Link to="/main-dashboard">Dashboard</Link>,
      },
      {
        key: "students",
        icon: <RightOutlined />,
        label: <Link to="/students">Student Subjects</Link>,
      },
      {
        key: "teacherGrading",
        icon: <RightOutlined />,
        label: <Link to="/teacher-grading">Input Grades</Link>,
      },
    ],
    Admin: [
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
        key: "teacherGrading",
        icon: <RightOutlined />,
        label: <Link to="/teacher-grading">Input Grades</Link>,
      },
      {
        key: "events",
        icon: <RightOutlined />,
        label: <Link to="/events">Events</Link>,
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
      {
        key: "midterm",
        icon: <RightOutlined />,
        label: <Link to="/midterm">Student Midterm Grades</Link>,
      },      
      {key: "finals",icon: <RightOutlined />,label: <Link to="/finals">Student Final Grades</Link>},
      {key: "viewing",icon: <RightOutlined />,label: <Link to="/view-grades">View Grades</Link>},
    ],
  };

  const items = menuItemsByRole[role] || [];

  return (
    <>
      {!collapsed && userName && (
        <div className="greeting-container" style={{ padding: "10px 16px" }}>
          <div className="greeting-content">
            <span>Hello, </span>
            <span className="username" style={{ fontWeight: 600 }}>
              {userName}.
            </span>
          </div>
        </div>
      )}

      <Menu
        theme="light"
        mode="inline"
        style={{ minHeight: "auto" }}
        items={items}
      />
    </>
  );
};

export default SidebarMenu;
