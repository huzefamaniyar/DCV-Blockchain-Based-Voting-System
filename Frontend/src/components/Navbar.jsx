import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import NotificationBell from './NotificationBell';
import { formatAddress } from '../lib/utils';

const Navbar = ({ onToggleSidebar }) => {
  const { user, walletAddress, logout, connectWallet, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <nav className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Left: menu + brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="md:hidden"
          onClick={onToggleSidebar}
        >
          Menu
        </Button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-primary text-sm font-bold">V</span>
          </span>
          <span className="hidden text-base md:inline">Voting dApp</span>
        </Link>
      </div>

      {/* Right: auth + wallet */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {walletAddress ? (
              <span className="rounded-md border bg-card px-2 py-1 text-xs font-mono">
                {formatAddress(walletAddress)}
              </span>
            ) : (
              <Button size="sm" onClick={handleConnectWallet}>
                Connect Wallet
              </Button>
            )}
            <NotificationBell />
            <Link to="/profile" className="text-sm font-medium">
              {user?.name || 'Profile'}
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
