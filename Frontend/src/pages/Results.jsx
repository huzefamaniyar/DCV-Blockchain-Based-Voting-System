import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Users, Vote, ArrowLeft, Download, Share2, Loader2, AlertCircle } from 'lucide-react';
import { electionAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await electionAPI.getResults(id);
      if (response.data.success) {
        const e = response.data.election;
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        const now = new Date();
        let status = e.status;
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          if (now < start) status = 'Upcoming';
          else if (now > end) status = 'Ended';
          else status = 'Active';
        }
        setElection({ ...e, status });
        setResults(response.data.results || []);
      }
    } catch (error) {
      toast.error('Failed to fetch results');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const totalVotes = results.reduce((sum, r) => sum + (r.votes || 0), 0);
  const winner = results.length > 0 ? results.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Election Not Found</h3>
            <Button onClick={() => navigate('/elections')}>Back to Elections</Button>
          </CardContent>
        </Card>
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
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/elections')}
            className="mb-4"
          >
            Back to Elections
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{election.title}</h1>
              <p className="text-gray-400">{election.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant={election.status === 'Ended' ? 'default' : 'success'}>
                  {election.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatDate(election.startTime)} - {formatDate(election.endTime)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" icon={Download}>
                Export
              </Button>
              <Button variant="outline" icon={Share2}>
                Share
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <Vote className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">{totalVotes}</div>
                <div className="text-sm text-gray-400">Total Votes Cast</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">{results.length}</div>
                <div className="text-sm text-gray-400">Candidates</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">
                  {winner ? `${((winner.votes / totalVotes) * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-400">Winning Margin</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Winner Card */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-white">Winner</h2>
                      <Badge variant="warning">Leading</Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{winner.candidateName}</h3>
                    <p className="text-gray-400">{winner.party}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-white mb-1">{winner.votes}</div>
                    <div className="text-sm text-gray-400">votes</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-2">
                      {((winner.votes / totalVotes) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Vote Distribution</CardTitle>
                <CardDescription>Votes received by each candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="candidateName" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="votes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Vote Share</CardTitle>
                <CardDescription>Percentage distribution of votes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={results}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ candidateName, percent }) =>
                        `${candidateName}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Complete breakdown of all candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-2xl font-bold text-gray-600 w-8">
                      #{index + 1}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {result.candidateName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">{result.candidateName}</h4>
                      <p className="text-sm text-gray-400">{result.party}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{result.votes}</div>
                      <div className="text-sm text-gray-400">
                        {((result.votes / totalVotes) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${(result.votes / totalVotes) * 100}%` }}
                        />
                      </div>
                    </div>
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

export default Results;
