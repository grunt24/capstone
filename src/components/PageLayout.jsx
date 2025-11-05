import { useEffect, useState } from "react";
import { Layout, Button, Drawer } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { MenuUnfoldOutlined } from "@ant-design/icons";

import Menulist from "./Menulist";
import loginService from "../../api/loginService";

const { Header, Sider, Content } = Layout;

const PageLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // for desktop sidebar
  const [drawerVisible, setDrawerVisible] = useState(false); // for mobile drawer
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Handle responsive detection
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize(); // Set on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    loginService.logout();
    navigate("/");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          width={280}
          trigger={null}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            background: "#fff",
            boxShadow: "2px 0 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="demo-logo-vertical" />
          <Menulist collapsed={collapsed} onMenuSelect={() => setCollapsed(true)} />
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{ padding: 0 }}
        >
          <Menulist collapsed={false} onMenuSelect={() => setDrawerVisible(false)} />
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header
          style={{
            background: "#2BAE66FF",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => {
              if (isMobile) {
                setDrawerVisible(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            style={{ fontSize: 18, color: "white" }}
          />

          <Button
            type="text"
            icon={<RiLogoutCircleRLine />}
            onClick={handleLogout}
            style={{
              fontSize: 20,
              color: "white",
            }}
          >
            <span style={{ fontSize: 15, marginLeft: 5 }}>Logout</span>
          </Button>
        </Header>

        {/* Main Content */}
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PageLayout;
