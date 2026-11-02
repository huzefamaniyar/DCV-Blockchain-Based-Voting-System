import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Calendar, Shield, Camera, CheckCircle, AlertCircle, Wallet, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import FaceCapture from '../components/FaceCapture';

const Profile = () => {
  const { user, walletAddress, connectWallet } = useAuth();
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    wardNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        wardNumber: user.wardNumber || ''
      });
    }
  }, [user]);

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (result.success) {
      toast.success('Wallet connected successfully!');
    } else {
      toast.error(result.message);
    }
  };

  const handleFaceRegistrationComplete = () => {
    setShowFaceCapture(false);
    toast.success('Face registered successfully!');
    // Refresh user data
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API
    toast.info('Profile update feature coming soon!');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        wardNumber: user.wardNumber || ''
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Not Logged In</h3>
            <p className="text-gray-400">Please log in to view your profile</p>
          </CardContent>
        </Card>
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
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and verification</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    {user.faceImage ? (
                      <AvatarImage src={user.faceImage} alt={user.name} />
                    ) : (
                      <AvatarFallback className="text-4xl">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {user.isVerified && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-gray-900">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    {user.role === 'admin' && (
                      <Badge variant="primary" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 mb-4">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {user.isVerified ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Face Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Not Verified
                      </Badge>
                    )}
                    {walletAddress && (
                      <Badge variant="info" className="gap-1">
                        <Wallet className="w-3 h-3" />
                        Wallet Connected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <div>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      icon={Edit2}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        icon={Save}
                        onClick={handleSaveProfile}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        icon={X}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Alert */}
        {!user.isVerified && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Complete Your Verification
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Register your face to participate in elections. This ensures one person, one vote.
                    </p>
                    <Button
                      variant="warning"
                      icon={Camera}
                      onClick={() => setShowFaceCapture(true)}
                    >
                      Register Face Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <User className="w-4 h-4 text-gray-500" />
                      {user.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Age
                  </label>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {user.age} years
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Gender
                  </label>
                  <div className="flex items-center gap-2 text-white capitalize">
                    <User className="w-4 h-4 text-gray-500" />
                    {user.gender}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Ward Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.wardNumber}
                      onChange={(e) => setFormData({ ...formData, wardNumber: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      Ward {user.wardNumber}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Aadhaar Number
                  </label>
                  <div className="flex items-center gap-2 text-white">
                    <Shield className="w-4 h-4 text-gray-500" />
                    {user.aadhaarNumber?.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-start gap-2 text-white">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      {user.address}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Wallet</CardTitle>
              <CardDescription>Connect your MetaMask wallet to vote</CardDescription>
            </CardHeader>
            <CardContent>
              {walletAddress ? (
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Wallet Connected</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Wallet Connected
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Connect your MetaMask wallet to participate in blockchain voting
                  </p>
                  <Button icon={Wallet} onClick={handleConnectWallet}>
                    Connect Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Face Registration</CardTitle>
                    <CardDescription>
                      Position your face in the camera and click capture
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setShowFaceCapture(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <FaceCapture
                  mode="register"
                  onSuccess={handleFaceRegistrationComplete}
                  onCancel={() => setShowFaceCapture(false)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
