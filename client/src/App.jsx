import './App.css';
import Homepage from './pages/homepage';
import Lobby from './pages/lobby';
import GamePage from './pages/game';
import Login from './pages/login';
import SignUp from './pages/signup';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/lobby/:roomCode" element={<Lobby />} />
          <Route path="/lobby" element={<Navigate to="/" replace />} />
          <Route path="/game/:roomCode" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
