import axiosInstance from "./axiosInstance";

const loginService = {
  async login(username, password) {
    try {
      const response = await axiosInstance.post("/Auth/login/", { username, password });

      // Extract token, username, and role from response
      const { token, username: userName, role } = response.data;

      if (token) {
        const userDetails = { userName, role }; // Store user info
        localStorage.setItem("token", token);
        localStorage.setItem("userDetails", JSON.stringify(userDetails));
        return { success: true, token, userDetails };
      }

      return { success: false, error: "Failed to fetch token" };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Login failed" };
    }
  },

  getUserDetails() {
    const userDetails = localStorage.getItem("userDetails");
    return userDetails ? JSON.parse(userDetails) : null;
  },

  getUserRoles() {
    const userDetails = this.getUserDetails();
    return userDetails ? userDetails.role : null;
  },

  getCurrentUserId() {
    const userDetails = this.getUserDetails();
    return userDetails ? userDetails.id : null;
  },

  getToken() {
    return localStorage.getItem("token") || null;
  },

  logout() {
    localStorage.clear();
    window.location.href = "/";
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default loginService;
