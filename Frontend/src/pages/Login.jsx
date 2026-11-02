import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { faceAPI } from '../utils/api';
import { toast } from 'react-toastify';
import FaceCapture from '../components/FaceCapture';
import Loader from '../components/Loader';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const Login = () => {
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'face'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        const to = (result.user?.role === 'admin' || result.isAdmin) ? '/admin' : '/dashboard';
        navigate(to);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }
    setShowFaceCapture(true);
  };

  const handleFaceCapture = async (faceData) => {
    setShowFaceCapture(false);
    setLoading(true);

    try {
      const response = await faceAPI.authenticate({
        email: formData.email,
        faceDescriptor: faceData.descriptor
      });

      if (response.data.success && response.data.matched) {
        localStorage.setItem('authToken', response.data.token);
        toast.success(`Welcome back! (${response.data.confidence}% match)`);
        const to = (response.data.user?.role === 'admin' || response.data.isAdmin) ? '/admin' : '/dashboard';
        navigate(to);
      } else {
        toast.error('Face authentication failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Face authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showFaceCapture) {
    return (
      <FaceCapture
        mode="login"
        onCapture={handleFaceCapture}
        onCancel={() => setShowFaceCapture(false)}
      />
    );
  }

  if (loading) {
    return <Loader fullScreen message="Logging in..." />;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to continue your voting journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Button
                variant={loginMode === 'password' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginMode('password')}
              >
                Password Login
              </Button>
              <Button
                variant={loginMode === 'face' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginMode('face')}
              >
                Face Recognition
              </Button>
            </div>

            {loginMode === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
                <div className="text-center text-sm text-muted-foreground">
                  <span>Don't have an account? </span>
                  <Link to="/register" className="underline underline-offset-4">Create one</Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <Button onClick={handleFaceLogin} className="w-full">Login with Face Recognition</Button>
                <p className="text-xs text-muted-foreground">Note: You must have registered your face to use this method.</p>
                <div className="text-center">
                  <Button variant="outline" onClick={() => setLoginMode('password')}>Use Password Instead</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
