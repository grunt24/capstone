import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import MainDashboard from './pages/MainDashboard/MainDashboard.jsx';

import PageLayout from './components/PageLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './components/Menulist.css';
import Subjects from "./pages/MainDashboard/Subjects.jsx";
import Teacher from "./pages/MainDashboard/Teacher.jsx";
import StudentSubject from "./pages/MainDashboard/StudentSubject.jsx";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PageLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/main-dashboard", element: <MainDashboard /> },
          { path: "/subjects", element: <Subjects /> },
          { path: "/teachers", element: <Teacher /> },
          { path: "/students", element: <StudentSubject /> },
        ],
      }
    ],
  },
  { path: "/", element: <Login /> },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
