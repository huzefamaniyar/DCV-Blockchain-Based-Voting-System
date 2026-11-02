import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { Menu, X, Vote, Home, User, LogIn, LogOut, BarChart2, MessageSquare, LogOutIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/elections', label: 'Elections', icon: Vote },
    { to: '/results', label: 'Results', icon: BarChart2 },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const authItems = [
    { to: '/login', label: 'Login', icon: LogIn, show: !isAuthenticated },
    { to: '/register', label: 'Register', show: !isAuthenticated },
    { to: '/profile', label: 'Profile', icon: User, show: isAuthenticated },
    {
      label: 'Logout',
      icon: LogOut,
      show: isAuthenticated,
      onClick: () => logout(),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
        {/* Left: brand + mobile menu */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Vote className="h-4 w-4 text-primary" />
            </span>
            <span className="hidden text-base md:inline">VoteChain</span>
          </Link>
        </div>

        {/* Right: auth actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link to="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                title="Profile"
              >
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile drawer nav */}
      {mobileOpen && (
        <div className="md:hidden border-b bg-card">
          <nav className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
            {authItems.map((item) =>
              item.show && (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    if (item.to) {
                      navigate(item.to);
                    }
                    if (item.onClick) item.onClick();
                  }}
                  className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent"
                >
                  {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                  {item.label}
                </button>
              ),
            )}
          </nav>
        </div>
      )}

      {/* Desktop sidebar + main content */}
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Sidebar (desktop only) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-card md:block">
          <nav className="flex h-full flex-col justify-between">
            <div className="mt-4 space-y-1 px-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t px-3 py-3 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} VoteChain
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
