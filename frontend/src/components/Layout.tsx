import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calendar, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Calendar className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  EventPro
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              <Link to="/events" className="text-gray-600 hover:text-indigo-600 font-medium">
                Browse Events
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/bookings" className="text-gray-600 hover:text-indigo-600 font-medium">
                    My Bookings
                  </Link>
                  
                  {user?.role === 'organizer' && (
                    <Link to="/organizer" className="text-gray-600 hover:text-indigo-600 font-medium">
                      Organizer Hub
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                      <Settings size={18} />
                      Admin
                    </Link>
                  )}

                  <div className="h-6 w-px bg-gray-200"></div>

                  <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-indigo-600" />
                      </div>
                      <span className="hidden sm:inline font-medium">{user?.full_name || user?.email}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
      
      <footer className="bg-white border-t mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 EventPro Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
