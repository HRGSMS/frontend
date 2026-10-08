import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppRouter } from './routes/AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
