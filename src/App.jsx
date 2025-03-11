import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import PageLayout from './components/PageLayout.jsx';
import './components/Menulist.css'

const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
    ]
  },
  { path: "/", element: <Login /> },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
