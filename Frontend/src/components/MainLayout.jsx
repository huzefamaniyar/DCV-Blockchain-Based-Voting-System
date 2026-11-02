import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Button from './ui/Button'
import Separator from './ui/Separator'
import { Vote, LayoutDashboard, BarChart2, MessageSquare, Menu, X, ChevronLeft, ChevronRight, User, LogIn, LogOut, Copy, Bell, Shield, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notificationAPI } from '../utils/api'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/elections', label: 'Elections', icon: Vote },
  { to: '/results', label: 'Results', icon: BarChart2 },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
  // Admin-only links
  { to: '/admin', label: 'Admin Panel', icon: Shield, adminOnly: true },
  { to: '/admin/create-election', label: 'Create Election', icon: Plus, adminOnly: true },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
]

export default function MainLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user, walletAddress, connectWallet, logout } = useAuth()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    setMobileOpen(false)
    setShowNotif(false)
  }, [location.pathname])

  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''
  const copyAddr = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* noop */ }
  }

  const renderIcon = (IconComp, props = {}) => {
    return typeof IconComp === 'function' ? <IconComp {...props} /> : null
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card/95 shadow-lg shadow-black/20',
          'w-64',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              {renderIcon(Vote, { className: 'h-5 w-5 text-primary' })}
            </span>
            {!isCollapsed && <span className="text-base">DCV</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            {renderIcon(X, { className: 'h-4 w-4 text-muted-foreground' })}
          </Button>
        </div>
        <Separator />

        {/* Sidebar nav */}
        <nav className="flex-1 space-y-4 px-2 py-4">
          <div className="space-y-1">
            <p className={cn(
              'px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground',
              isCollapsed && 'text-center px-0'
            )}>
              Main
            </p>
            {navItems
              .filter((item) => !item.adminOnly)
              .map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                      'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      isCollapsed ? 'justify-center gap-0' : 'gap-3'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {renderIcon(Icon, {
                          className: cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive ? 'text-blue-400' : 'text-gray-300'
                          ),
                        })}
                        <span
                          className={cn(
                            'ml-3 overflow-hidden whitespace-nowrap text-sm transition-all duration-200',
                            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                          )}
                        >
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              })}
          </div>

          {/* Admin section */}
          {isAuthenticated && user?.role === 'admin' && (
            <div className="space-y-1">
              <p className={cn(
                'px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground',
                isCollapsed && 'text-center px-0'
              )}>
                Admin
              </p>
              {navItems
                .filter((item) => item.adminOnly)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        isCollapsed ? 'justify-center gap-0' : 'gap-3'
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          {renderIcon(Icon, {
                            className: cn(
                              'h-5 w-5 shrink-0 transition-colors',
                              isActive ? 'text-blue-400' : 'text-gray-300'
                            ),
                          })}
                          <span
                            className={cn(
                              'ml-3 overflow-hidden whitespace-nowrap text-sm transition-all duration-200',
                              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                            )}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
            </div>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t px-3 py-3">
          <div className={cn('flex items-center gap-2', isCollapsed ? 'justify-center' : 'justify-between')}>
            {!isCollapsed && isAuthenticated && (
              <div className="flex items-center gap-3">
                {user?.faceImage ? (
                  <img
                    src={user.faceImage}
                    alt={user?.name || 'User'}
                    className="h-9 w-9 rounded-full object-cover border border-primary/40"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                    {renderIcon(User, { className: 'h-4 w-4 text-primary-foreground' })}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed((v) => !v)}
            >
              {isCollapsed
                ? renderIcon(ChevronRight, { className: 'h-4 w-4 text-muted-foreground' })
                : renderIcon(ChevronLeft, { className: 'h-4 w-4 text-muted-foreground' })}
            </Button>
          </div>
        </div>
      </aside>

      {/* Content Column */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen
                  ? renderIcon(X, { className: 'h-5 w-5 text-foreground' })
                  : renderIcon(Menu, { className: 'h-5 w-5 text-foreground' })}
              </Button>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Dashboard</span>
                <h1 className="text-lg font-semibold">
                  {navItems.find((n) => n.to === location.pathname)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="relative flex items-center gap-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                title="Notifications"
                onClick={async () => {
                  setShowNotif((s) => !s)
                  if (!showNotif) {
                    setNotifLoading(true)
                    try {
                      const res = await notificationAPI.getMyNotifications()
                      setNotifications(res.data?.notifications || [])
                    } catch {
                      // ignore fetch errors
                      setNotifications([])
                    } finally {
                      setNotifLoading(false)
                    }
                  }
                }}
              >
                {renderIcon(Bell, { className: 'h-4 w-4 text-gray-200' })}
              </Button>
              {showNotif && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border bg-card shadow-xl">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Notifications</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await notificationAPI.markAllAsRead()
                            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                          } catch {
                            // ignore mark all errors
                          }
                        }}
                      >
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            // delete one by one for now
                            await Promise.all(
                              notifications.map((n) => notificationAPI.deleteNotification(n.id || n._id))
                            )
                          } catch {
                            // ignore delete-all errors
                          }
                          setNotifications([])
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {notifLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id || n._id} className="group mb-2 rounded-md border p-3 last:mb-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{n.title || 'Notification'}</p>
                              {n.message && <p className="truncate text-xs text-muted-foreground">{n.message}</p>}
                            </div>
                            <div className="ml-2 flex shrink-0 gap-1">
                              {!n.read && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await notificationAPI.markAsRead(n.id || n._id)
                                      setNotifications((prev) => prev.map((x) => x === n ? { ...x, read: true } : x))
                                    } catch {
                                      // ignore mark as read errors
                                    }
                                  }}
                                >
                                  Read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await notificationAPI.deleteNotification(n.id || n._id)
                                  } catch {
                                    // ignore single delete errors
                                  }
                                  setNotifications((prev) => prev.filter((x) => (x.id || x._id) !== (n.id || n._id)))
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {n.createdAt && (
                            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Wallet pill */}
              {walletAddress ? (
                <div className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs">
                  <span className="font-mono">{shortAddr(walletAddress)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyAddr}
                    title="Copy address"
                  >
                    {renderIcon(Copy, { className: 'h-3.5 w-3.5 text-gray-300' })}
                  </Button>
                  {copied && <span className="text-muted-foreground">Copied</span>}
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={connectWallet}>
                  Connect Wallet
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  {/* Profile button linking to profile page */}
                  <Link to="/profile">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      title="Profile"
                    >
                      {renderIcon(User, { className: 'h-4 w-4 text-gray-200' })}
                    </Button>
                  </Link>

                  {/* Logout button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={logout}
                    title="Logout"
                  >
                    {renderIcon(LogOut, { className: 'h-4 w-4 text-gray-200' })}
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="gap-2">
                    {renderIcon(LogIn, { className: 'h-4 w-4 text-gray-200' })}
                    <span>Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  )
}
