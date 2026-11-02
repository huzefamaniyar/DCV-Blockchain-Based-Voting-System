import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Users, Vote, MessageSquare, Shield, Trash2, Edit, 
  CheckCircle, XCircle, Calendar, TrendingUp, BarChart3
} from 'lucide-react';
import { electionAPI, feedbackAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { formatDate } from '../lib/utils';

const AdminPanel = () => {
  const [elections, setElections] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    totalVotes: 0,
    totalFeedbacks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [electionsRes, feedbacksRes] = await Promise.all([
        electionAPI.getAll(),
        feedbackAPI.getAll().catch(() => ({ data: { feedbacks: [] } }))
      ]);

      if (electionsRes.data.success) {
        const electionData = electionsRes.data.elections;
        setElections(electionData);
        
        setStats({
          totalElections: electionData.length,
          activeElections: electionData.filter(e => e.status === 'Active').length,
          totalVotes: electionData.reduce((sum, e) => sum + parseInt(e.totalVotes || 0), 0),
          totalFeedbacks: feedbacksRes.data.feedbacks?.length || 0
        });
      }

      setFeedbacks(feedbacksRes.data.feedbacks || []);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this election?')) {
      return;
    }

    try {
      const response = await electionAPI.delete(id);
      if (response.data.success) {
        toast.success('Election deleted successfully');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete election');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-gray-400">Manage elections, users, and system settings</p>
            </div>
            <Link to="/admin/create-election">
              <Button icon={Plus} size="lg">
                Create Election
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Elections</p>
                    <p className="text-3xl font-bold text-white">{stats.totalElections}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Vote className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Active Elections</p>
                    <p className="text-3xl font-bold text-white">{stats.activeElections}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Votes</p>
                    <p className="text-3xl font-bold text-white">{stats.totalVotes}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Feedbacks</p>
                    <p className="text-3xl font-bold text-white">{stats.totalFeedbacks}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs defaultValue="elections">
            <TabsList>
              <TabsTrigger value="elections">Elections</TabsTrigger>
              <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            {/* Elections Tab */}
            <TabsContent value="elections">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Elections</CardTitle>
                  <CardDescription>View, edit, and delete elections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {elections.length === 0 ? (
                      <div className="text-center py-12">
                        <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No elections yet</p>
                        <Link to="/admin/create-election">
                          <Button icon={Plus}>Create First Election</Button>
                        </Link>
                      </div>
                    ) : (
                      elections.map((election) => (
                        <div
                          key={election.id}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{election.title}</h3>
                                <Badge variant={
                                  election.status === 'Active' ? 'success' :
                                  election.status === 'Upcoming' ? 'warning' : 'default'
                                }>
                                  {election.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                                <div>
                                  <span className="block text-gray-500">Start</span>
                                  {formatDate(election.startTime)}
                                </div>
                                <div>
                                  <span className="block text-gray-500">End</span>
                                  {formatDate(election.endTime)}
                                </div>
                                <div>
                                  <span className="block text-gray-500">Candidates</span>
                                  {election.candidateCount}
                                </div>
                                <div>
                                  <span className="block text-gray-500">Total Votes</span>
                                  {election.totalVotes}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/results/${election.id}`}>
                                <Button variant="outline" size="sm">
                                  View Results
                                </Button>
                              </Link>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => handleDeleteElection(election.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedbacks Tab */}
            <TabsContent value="feedbacks">
              <Card>
                <CardHeader>
                  <CardTitle>User Feedbacks</CardTitle>
                  <CardDescription>View and respond to user feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No feedbacks yet</p>
                      </div>
                    ) : (
                      feedbacks.map((feedback, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-semibold">{feedback.subject}</h4>
                              <p className="text-sm text-gray-400">
                                From: {feedback.userName} ({feedback.userEmail})
                              </p>
                            </div>
                            <Badge>{feedback.category}</Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{feedback.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage registered users</CardDescription>
                    </div>
                    <Link to="/admin/users">
                      <Button icon={Users}>Manage Users</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    Click "Manage Users" to view and edit user accounts
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Voter Verification</CardTitle>
                      <CardDescription>Verify and approve voters</CardDescription>
                    </div>
                    <Link to="/admin/verification">
                      <Button icon={Shield}>View Pending</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    Click "View Pending" to see users awaiting verification
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
