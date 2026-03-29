import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HostCreateGame from "./pages/HostCreateGame";
import HostLobby from "./pages/HostLobby";
import Login from "./pages/Login";
import Register from "./pages/Register";

const router = createBrowserRouter([
  { path: "/Login", element: <Login /> },
  { path: "/Register", element: <Register /> },
  { path: "/", element: <Login /> },
  { path: "/HostCreateGame", element: <HostCreateGame /> },
  { path: "/HostLobby", element: <HostLobby /> },
  
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;