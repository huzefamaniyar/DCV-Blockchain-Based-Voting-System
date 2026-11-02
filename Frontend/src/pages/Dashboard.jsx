import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { electionAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BarChart3, Activity, CheckCircle, Clock, Vote, User, MessageSquare, Shield, Wallet, AlertCircle, ArrowRight, Calendar, TrendingUp, Users, Award, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Loader from '../components/Loader';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { formatDate } from '../lib/utils';

const Dashboard = () => {
  const { user, walletAddress, connectWallet } = useAuth();
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    voted: 0,
    upcoming: 0
  });
  const [loading, setLoading] = useState(true);

  const computeStatus = (e) => {
    const now = new Date();
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return e.status || 'Upcoming';
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Active';
  };

  const fetchElections = async () => {
    try {
      const response = await electionAPI.getAll();
      if (response.data.success) {
        const allElections = (response.data.elections || []).map((e) => ({ ...e, status: computeStatus(e) }));
        setElections(allElections);

        // Calculate stats
        const activeElections = allElections.filter(e => e.status === 'Active').length;
        const upcomingElections = allElections.filter(e => e.status === 'Upcoming').length;
        const votedElections = user?.votedElections?.length || 0;

        setStats({
          total: allElections.length,
          active: activeElections,
          voted: votedElections,
          upcoming: upcomingElections
        });
      }
    } catch (err) {
      toast.error('Failed to fetch elections');
      console.error('Error fetching elections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (result.success) {
      toast.success('Wallet connected successfully!');
    } else {
      toast.error(result.message);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  // Mock data for charts
  const votingTrendData = [
    { month: 'Jan', votes: 120 },
    { month: 'Feb', votes: 180 },
    { month: 'Mar', votes: 250 },
    { month: 'Apr', votes: 320 },
    { month: 'May', votes: 280 },
    { month: 'Jun', votes: 390 }
  ];

  const electionStatusData = [
    { name: 'Active', value: stats.active, color: '#10b981' },
    { name: 'Upcoming', value: stats.upcoming, color: '#f59e0b' },
    { name: 'Completed', value: stats.total - stats.active - stats.upcoming, color: '#6366f1' }
  ];

  // const participationData = [
  //   { category: 'Voted', value: stats.voted },
  //   { category: 'Pending', value: stats.active - stats.voted }
  // ];

  // const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
      </div>

      <div className="page-container py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border-none overflow-hidden">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-80" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-glass)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
                    <TrendingUp className="h-3.5 w-3.5" /> Dashboard
                  </div>
                  <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                    Welcome back, {user?.name}! 👋
                  </h1>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-xl">
                    Track election stats, manage your participation, and stay on top of upcoming ballots in real time.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  {user?.isVerified ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Face Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Face Not Registered
                    </Badge>
                  )}
                  <Badge variant="info" className="gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date().toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts */}
        {!user?.isVerified && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass-card border border-yellow-500/30 bg-yellow-500/10">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Action required</p>
                    <p className="text-sm text-yellow-100/80">Register your face to unlock voting privileges.</p>
                  </div>
                </div>
                <Link to="/profile">
                  <Button size="sm" variant="warning">Register Face</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!walletAddress && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border border-blue-500/30 bg-blue-500/10">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                    <Wallet className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Connect your wallet</p>
                    <p className="text-sm text-blue-100/80">Link MetaMask to sign transactions and cast tamper-proof votes.</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleConnectWallet} icon={Wallet}>Connect</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BarChart3, label: 'Total Elections', value: stats.total, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', trend: '+12%' },
            { icon: Activity, label: 'Active Elections', value: stats.active, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', textColor: 'text-green-400', trend: '+8%' },
            { icon: CheckCircle, label: 'Votes Cast', value: stats.voted, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', trend: '+23%' },
            { icon: Clock, label: 'Upcoming', value: stats.upcoming, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', trend: '+5%' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card border-none">
                  <CardContent className="relative overflow-hidden p-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-15`} />
                    <div className="relative flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.textColor}`} />
                      </div>
                      <Badge variant="success" className="gap-1 text-xs">
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className="relative mt-6">
                      <div className="text-3xl font-semibold text-white">{stat.value}</div>
                      <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                      <Progress value={stats.total ? Math.min((stat.value / stats.total) * 100, 100) : 0} className="mt-4 h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Voting Trends Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Voting Trends
                </CardTitle>
                <CardDescription>Monthly voting activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={votingTrendData}>
                    <defs>
                      <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="votes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVotes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Election Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Election Status
                </CardTitle>
                <CardDescription>Distribution of election states</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={electionStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {electionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Active Elections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-[var(--color-border)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Elections</CardTitle>
                  <CardDescription>Vote in ongoing elections</CardDescription>
                </div>
                <Link to="/elections">
                  <Button variant="outline" size="sm" icon={ArrowRight}>
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {elections
                  .filter(e => e.status === 'Active')
                  .slice(0, 3)
                  .map((election, index) => (
                    <motion.div
                      key={election.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-glass)] p-4 transition hover:border-blue-500/40"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{election.title}</h3>
                          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                            <Badge variant="success">Live</Badge>
                            <span className="flex items-center gap-1">
                              <Vote className="w-4 h-4" />
                              {election.totalVotes} votes
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {election.candidateCount} candidates
                            </span>
                          </div>
                          <p className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                            <Calendar className="w-4 h-4" />
                            Ends: {formatDate(election.endTime)}
                          </p>
                        </div>
                        <Link to={`/election/${election.id}`}>
                          <Button icon={ArrowRight}>View</Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}

                {elections.filter(e => e.status === 'Active').length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-12 text-center">
                    <Activity className="h-12 w-12 text-[var(--color-text-muted)]" />
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No active elections at the moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Participation Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card border-[var(--color-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Your Participation
              </CardTitle>
              <CardDescription>Track your voting activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    icon: Users,
                    value: stats.voted,
                    label: 'Elections Voted',
                    gradient: 'from-blue-500/15 via-purple-500/15 to-blue-400/10',
                    iconColor: 'text-blue-300'
                  },
                  {
                    icon: Zap,
                    value: stats.active,
                    label: 'Active Now',
                    gradient: 'from-green-500/15 via-emerald-500/15 to-green-400/10',
                    iconColor: 'text-green-300'
                  },
                  {
                    icon: Award,
                    value: `${stats.total ? Math.round((stats.voted / stats.total) * 100) : 0}%`,
                    label: 'Participation Rate',
                    gradient: 'from-purple-500/15 via-pink-500/15 to-purple-400/10',
                    iconColor: 'text-purple-300'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`rounded-xl border border-[var(--color-border)] bg-gradient-to-br ${item.gradient} p-6 text-center`}
                    >
                      <Icon className={`mx-auto mb-3 h-8 w-8 ${item.iconColor}`} />
                      <div className="text-3xl font-semibold text-white">{item.value}</div>
                      <p className="text-sm text-[var(--color-text-secondary)]">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/elections', icon: Vote, title: 'Browse Elections', desc: 'View all available elections' },
            { to: '/profile', icon: User, title: 'My Profile', desc: 'Manage your account settings' },
            { to: '/feedback', icon: MessageSquare, title: 'Contact Admin', desc: 'Send feedback or report issues' },
            ...(user?.role === 'admin' ? [{ to: '/admin', icon: Shield, title: 'Admin Panel', desc: 'Manage elections and users' }] : [])
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Link to={action.to}>
                  <Card className="group relative h-full overflow-hidden border-none bg-[var(--color-bg-glass)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 transition-all group-hover:from-blue-500/10 group-hover:to-purple-500/10" />
                    <CardContent className="relative p-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 transition group-hover:scale-110">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-blue-300">{action.title}</h3>
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{action.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* User Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="glass-card border-[var(--color-border)]">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Account details and verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Age', value: `${user?.age} years` },
                  { label: 'Ward', value: user?.wardNumber },
                  { 
                    label: 'Wallet', 
                    value: walletAddress ? (
                      <Badge variant="success" className="gap-1">
                        <Wallet className="w-3 h-3" />
                        {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleConnectWallet} icon={Wallet}>
                        Connect
                      </Button>
                    )
                  },
                  { 
                    label: 'Face Verified', 
                    value: user?.isVerified ? (
                      <Badge variant="success">✓ Yes</Badge>
                    ) : (
                      <Badge variant="warning">✗ No</Badge>
                    )
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-[var(--color-border)] py-3 last:border-b-0">
                    <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
