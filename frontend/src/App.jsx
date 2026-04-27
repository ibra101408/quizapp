import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import HostCreateGame from "./pages/HostCreateGame";
import Home from "./pages/Home";
import HostLobby from "./pages/HostLobby";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MyQuizzes from "./pages/MyQuizzes";
import JoinGame from "./pages/JoinGame";
import PlayerView from "./pages/Player/PlayerView";

const router = createBrowserRouter([
  { path: "/Login", element: <Login /> },
  { path: "/Register", element: <Register /> },
  {
    path: "/Home",
    element: <ProtectedRoute><Home /></ProtectedRoute>,
  },
  { path: "/", element: <Login /> },
  {
    path: "/HostCreateGame",
    element: <ProtectedRoute><HostCreateGame /></ProtectedRoute>,
  },
  {
    path: "/HostLobby/:gamePin",
    element: <ProtectedRoute><HostLobby /></ProtectedRoute>,
  },
  { path: "/MyQuizzes", element: <ProtectedRoute><MyQuizzes /></ProtectedRoute> },
  { path: "/game/:gamePin", element: <JoinGame /> },
  { path: "/Player", element: <PlayerView /> },
]);

function App() {
  return (
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
  );
}

export default App;