import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Spin, Alert } from "antd";
import "./Login.css";

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
  
    try {
      if (values.userName === "admin" && values.password === "admin") {
        message.success("Login Successful!", 2);
        setTimeout(() => {
          navigate("/dashboard");
          setLoading(false);
        }, 3000);
        return;
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
    }
    setLoading(false);
  };
  

  return (
    <div className="container">
      <div className="form-container">
        <p className="title">Performance Tracker</p>
        
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: "10px" }} />}
        
        <Form className="form" onFinish={handleSubmit}>
          <Form.Item name="userName" rules={[{ required: true, message: "Please enter your email!" }]}> 
            <Input className="input" placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Please enter your password!" }]}> 
            <Input.Password className="input" placeholder="Password" />
          </Form.Item>
          <p className="page-link">
            <span className="page-link-label">Forgot Password?</span>
          </p>
          <Button htmlType="submit" className="form-btn" block disabled={loading}>
            {loading ? <Spin size="small" /> : "Login"}
          </Button>
        </Form>
        <p className="sign-up-label">
          Don't have an account? <span className="sign-up-link">Sign up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;