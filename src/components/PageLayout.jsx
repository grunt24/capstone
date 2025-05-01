import { useState } from "react";
import { Layout, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

import Menulist from "./Menulist";
import loginService from "../../api/loginService";

const { Header, Sider, Content } = Layout;

const PageLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    loginService.logout();
    navigate("/");
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 6px;",
      }}
    >
      <Sider
        width={280}
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="box-shadow"
        style={{ background: "#FCF6F5FF" }}
      >
        <div className="demo-logo-vertical" />
        <Menulist collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#2BAE66FF",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
              color: "white",
            }}
          />
          <Button
            type="text"
            icon={<RiLogoutCircleRLine />}
            onClick={handleLogout}
            style={{
              fontSize: "23px",
              marginRight: 20,
              marginTop: 20,
              color: "white",
            }}
          >
            <span
              className="logout-text"
              style={{ fontSize: 15, marginBottom: 5 }}
            >
              Logout
            </span>
          </Button>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PageLayout;
