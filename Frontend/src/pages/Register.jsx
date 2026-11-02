import { useState, Component, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// Lazy-load FaceCapture to avoid executing it when running minimal bypass
const FaceCapture = lazy(() => import('../components/FaceCapture'));
import Loader from '../components/Loader';
import { authAPI } from '../utils/api';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error in child:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#220000', color: '#fff', borderRadius: 8 }}>
          <h3>Component error</h3>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {String(this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Register = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: Face Registration
  const [registrationToken, setRegistrationToken] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    aadhaarNumber: '',
    address: '',
    wardNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    if (formData.age < 18) {
      toast.error('You must be at least 18 years old');
      return false;
    }

    if (formData.aadhaarNumber.length !== 12) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Begin registration without writing to DB
      const resp = await authAPI.beginRegistration({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        gender: formData.gender,
        aadhaarNumber: formData.aadhaarNumber,
        address: formData.address,
        wardNumber: formData.wardNumber
      });

      if (resp?.data?.success && resp?.data?.registration_token) {
        setRegistrationToken(resp.data.registration_token);
        toast.success('Details accepted! Now register your face to complete signup.');
        setStep(2);
      } else {
        toast.error(resp?.data?.message || 'Failed to start registration');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (faceData) => {
    // FaceCapture will already have called backend in tokenized flow
    if (!faceData || !faceData.descriptor || !faceData.image) {
      toast.error('Invalid face data. Please try again.');
      return;
    }
    toast.success('Face capture complete! Redirecting...');
    navigate('/dashboard');
  };

  const handleSkipFace = () => {
    toast.info('You can register your face later from your profile');
    navigate('/dashboard');
  };

  if (loading) {
    return <Loader fullScreen message="Processing..." />;
  }

  if (step === 2) {
    // Debug logs to identify invalid element type issues
    console.log('[Register] Step=2. FaceCapture typeof:', typeof FaceCapture);
    // Accept functions and React.lazy objects
    const FaceUndefined = !FaceCapture || (typeof FaceCapture !== 'function' && typeof FaceCapture !== 'object');

    const MIN_STEP2_TEST = false;
    if (MIN_STEP2_TEST) {
      console.log('[Register] Rendering Step 2 Minimal Test bypass');
      return (
        <div style={{ padding: 16 }}>
          <h2>Step 2 Minimal Test</h2>
          <p>If you can see this, the error is inside FaceCapture or its children.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-outline" onClick={handleSkipFace}>Skip for Now</button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="face-registration-wrapper" style={{ padding: 16 }}>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ padding: 16 }}>Loading face module…</div>}>
            <FaceCapture
              mode="register"
              registrationToken={registrationToken}
              onCapture={handleFaceCapture}
              onCancel={() => setStep(1)}
            />
          </Suspense>
        </ErrorBoundary>
        <div className="skip-section" style={{ marginTop: 16 }}>
          <button onClick={handleSkipFace} className="btn btn-outline">
            Skip for Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create your account to start voting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                  <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Password *</label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</label>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="age" className="text-sm font-medium">Age *</label>
                  <input type="number" id="age" name="age" min="18" value={formData.age} onChange={handleChange} placeholder="Must be 18+" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="gender" className="text-sm font-medium">Gender *</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="aadhaarNumber" className="text-sm font-medium">Aadhaar Number *</label>
                <input id="aadhaarNumber" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} placeholder="12-digit Aadhaar number" maxLength="12" pattern="[0-9]{12}" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                <p className="text-xs text-muted-foreground">Your Aadhaar ensures one vote per person</p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="address" className="text-sm font-medium">Address *</label>
                <textarea id="address" name="address" rows="3" value={formData.address} onChange={handleChange} placeholder="Enter your complete address" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
              </div>

              <div className="grid gap-2">
                <label htmlFor="wardNumber" className="text-sm font-medium">Ward Number *</label>
                <input id="wardNumber" name="wardNumber" value={formData.wardNumber} onChange={handleChange} placeholder="Enter your ward number" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
              </div>

              <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
                <strong>Next Step:</strong> After registration, you'll be asked to register your face for biometric authentication.
              </div>

              <Button type="submit" className="w-full">Register Account</Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="underline underline-offset-4">Login here</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
