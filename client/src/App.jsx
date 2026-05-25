import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import CircleDetails from './pages/CircleDetails';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans text-slate-200 selection:bg-indigo-500/30">
          <Navbar />
          <main className="flex-grow flex flex-col relative">
            {/* Global Background ambient glows */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
            </div>
            
            <div className="flex-grow flex flex-col w-full relative z-10">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
                <Route path="/circles/:id" element={<PrivateRoute><CircleDetails /></PrivateRoute>} />
              </Routes>
            </div>
          </main>
        </div>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.1)',
            }
          }} 
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
