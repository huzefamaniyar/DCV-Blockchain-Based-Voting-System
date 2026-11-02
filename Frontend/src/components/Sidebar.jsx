import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PlusCircle, Shield, Users, CheckCircle2, MessageSquare, X, Vote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const Sidebar = ({ open, onClose }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const sections = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    const base = [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }
        ]
      },
      {
        title: 'Elections',
        items: [
          { label: 'All Elections', to: '/elections', icon: ListChecks }
        ]
      }
    ];

    if (isAdmin) {
      base.push({
        title: 'Admin Tools',
        items: [
          { label: 'Manage Elections', to: '/admin', icon: Shield },
          { label: 'Create Election', to: '/admin/create-election', icon: PlusCircle },
          { label: 'User Management', to: '/admin/users', icon: Users },
          { label: 'Voter Verification', to: '/admin/verification', icon: CheckCircle2 }
        ]
      });
    }

    base.push({
      title: 'Support',
      items: [
        { label: 'Contact Admin', to: '/feedback', icon: MessageSquare }
      ]
    });

    return base;
  }, [isAuthenticated, isAdmin]);

  const renderNav = () => (
    <nav className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {section.title}
          </p>
          <div className="mt-4 space-y-1.5">
            {section.items.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-all ${
                    active
                      ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20'
                      : 'text-muted-foreground hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div
        className={`fixed top-16 right-0 bottom-0 left-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-16 bottom-0 left-0 z-50 flex h-[calc(100vh-4rem)] w-72 flex-col border-r bg-card shadow-2xl shadow-black/30 transition-transform duration-300 lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30">
              <Vote className="h-4 w-4 text-blue-200" />
            </span>
            Navigation
          </span>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="hidden items-center gap-3 px-6 pt-6 lg:flex">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20">
            <Vote className="h-5 w-5 text-blue-200" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Voting dApp</p>
            <p className="text-xs text-muted-foreground">Secure blockchain elections</p>
          </div>
        </div>
        {renderNav()}
        <div className="border-t border-(--color-border) px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Voting dApp
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
