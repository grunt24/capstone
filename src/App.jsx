import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import PageLayout from './components/PageLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './components/Menulist.css';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PageLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
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
