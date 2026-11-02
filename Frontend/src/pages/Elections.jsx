import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, Users, Vote, Clock, CheckCircle, XCircle, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { electionAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { formatDate } from '../lib/utils';
import { useDashboardSocket } from '../hooks/useSocket';

const Elections = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nowTs, setNowTs] = useState(Date.now());

  const computeStatus = (e) => {
    const now = new Date();
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return e.status || 'Upcoming';
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Active';
  };

  const formatRemaining = (target) => {
    let diff = Math.max(target - nowTs, 0);
    const d = Math.floor(diff / (24*3600*1000)); diff -= d*24*3600*1000;
    const h = Math.floor(diff / (3600*1000)); diff -= h*3600*1000;
    const m = Math.floor(diff / (60*1000)); diff -= m*60*1000;
    const s = Math.floor(diff / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const fetchElections = useCallback(async () => {
    try {
      const response = await electionAPI.getAll();
      if (response.data.success) {
        const normalized = (response.data.elections || []).map((e) => ({
          ...e,
          status: computeStatus(e),
        }));
        setElections(normalized);
        if (response.data.cached) {
          console.log('📦 Loaded from cache');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch elections', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ticker for countdowns
  useEffect(() => {
    const int = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  // Real-time updates
  const handleElectionUpdate = useCallback((data) => {
    console.log('🔄 Election updated:', data);
    toast.info('Election updated! Refreshing...', {
      position: 'bottom-right',
      autoClose: 2000
    });
    fetchElections();
  }, [fetchElections]);

  const handleElectionCreated = useCallback((data) => {
    console.log('✨ New election created:', data);
    toast.success('New election available!', {
      position: 'bottom-right',
      autoClose: 3000
    });
    fetchElections();
  }, [fetchElections]);

  // Connect to socket for real-time updates
  useDashboardSocket(handleElectionUpdate, handleElectionCreated);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  useEffect(() => {
    filterElections();
  }, [elections, searchQuery, statusFilter]);

  const filterElections = () => {
    let filtered = elections;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status.toLowerCase() === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredElections(filtered);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      upcoming: 'warning',
      ended: 'default'
    };
    return variants[status.toLowerCase()] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'ended':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Elections</h1>
          <p className="text-gray-400">Browse and participate in ongoing elections</p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search elections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Tabs */}
                <Tabs defaultValue="all" onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="ended">Ended</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <Vote className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">{elections.length}</div>
              <div className="text-sm text-gray-400">Total Elections</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {elections.filter(e => e.status === 'Active').length}
              </div>
              <div className="text-sm text-gray-400">Active Now</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {elections.filter(e => e.status === 'Upcoming').length}
              </div>
              <div className="text-sm text-gray-400">Upcoming</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Elections List */}
        <div className="space-y-4">
          {filteredElections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-12 text-center">
                  <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No elections found</h3>
                  <p className="text-gray-400">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No elections available at the moment'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredElections.map((election, index) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card hover className="group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Vote className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                {election.title}
                              </h3>
                              <Badge variant={getStatusBadge(election.status)} className="gap-1">
                                {getStatusIcon(election.status)}
                                {election.status}
                              </Badge>
                              {(election.status === 'Upcoming' || election.status === 'Active') && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  {election.status === 'Upcoming' ? 'Starts in ' : 'Ends in '}
                                  {election.status === 'Upcoming'
                                    ? formatRemaining(new Date(election.startTime).getTime())
                                    : formatRemaining(new Date(election.endTime).getTime())}
                                </span>
                              )}
                            </div>
                            {election.description && (
                              <p className="text-gray-400 text-sm mb-3">{election.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(election.startTime)} - {formatDate(election.endTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {election.candidateCount || 0} candidates
                              </span>
                              <span className="flex items-center gap-1">
                                <Vote className="w-4 h-4" />
                                {election.totalVotes || 0} votes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={`/election/${election.id}`}>
                          <Button icon={ArrowRight} className="w-full md:w-auto">
                            View Details
                          </Button>
                        </Link>
                        {election.status === 'Active' && (
                          <Link to={`/vote/${election.id}`}>
                            <Button variant="success" icon={Vote} className="w-full md:w-auto">
                              Vote Now
                            </Button>
                          </Link>
                        )}
                        {election.status === 'Ended' && (
                          <Link to={`/results/${election.id}`}>
                            <Button variant="outline" className="w-full md:w-auto">
                              View Results
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Elections;
