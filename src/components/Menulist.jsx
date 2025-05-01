import { useEffect, useState } from "react";
import { Menu } from "antd";
import { MdPayments } from "react-icons/md";
import { HomeFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";

const SidebarMenu = ({ collapsed }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const userDetails = localStorage.getItem("userDetails");
    if (userDetails) {
      const { userName } = JSON.parse(userDetails);
      setUserName(userName);
    }
  }, []);

  return (
    <Menu theme="light" mode="inline" style={{ minHeight: "100vh" }}>
      <Menu.Item key="home1" icon={<MdPayments />} style={{ marginTop: 10 }}>
        <p style={{ fontWeight: 700 }}>BCAS Grade Portal</p>
      </Menu.Item>

      {!collapsed && userName && (
        <div className="greeting-container">
          <div className="greeting-content">
            <span>Hello, </span><span className="username">{userName}!</span>
          </div>
        </div>
      )}

      <Menu.Item key="home2" icon={<HomeFilled />}>
        <Link to="/dashboard">Dashboard</Link>
      </Menu.Item>
    </Menu>
  );
};

export default SidebarMenu;
