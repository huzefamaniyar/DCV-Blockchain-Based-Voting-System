import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { faceAPI } from '../utils/api';
import { loadModels, startVideo, stopVideo, detectFace, startRealTimeDetection, captureFaceImage } from '../utils/faceRecognition';
import Loader from './Loader';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import Separator from './ui/Separator';


const FaceCapture = ({ onCapture, onCancel, mode = 'register', registrationToken }) => {
  // Declare hooks at top-level only

  console.log('[FaceCapture] typeof Loader =', typeof Loader);
  const loaderValid = !!Loader && typeof Loader === 'function';
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [stabilizedFrames, setStabilizedFrames] = useState(0);
  const STABILITY_THRESHOLD = 3; // number of continuous frames before enabling capture
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [mirrored, setMirrored] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastFacesRef = useRef([]);
  const ensureVideoElement = async (timeoutMs = 3000) => {
    const start = Date.now();
    while (!videoRef.current) {
      if (Date.now() - start > timeoutMs) break;
      await new Promise(r => setTimeout(r, 50));
    }
    return videoRef.current;
  };

  const restartWithSelectedDevice = async (deviceId) => {
    try {
      setSelectedDeviceId(deviceId);
      if (!cameraActive) return;
      cleanup();
      const videoEl = await ensureVideoElement();
      if (!videoEl) return;
      await startVideo(videoEl, { deviceId });
      await waitForVideoFrames(2000);
      setCameraActive(true);
      detectionIntervalRef.current = await startRealTimeDetection(
        videoRef.current,
        canvasRef.current,
        (detections) => {
          const detected = detections && detections.length > 0;
          lastFacesRef.current = detections || [];
          setFaceDetected(detected);
          setCameraActive(!!(videoRef.current && videoRef.current.srcObject));
          if (detected) setStabilizedFrames(prev => Math.min(prev + 1, STABILITY_THRESHOLD));
          else setStabilizedFrames(0);
        }
      );
    } catch (e) {
      console.error('Failed to restart with device', deviceId, e);
      setMessage('Failed to switch camera.');
    }
  };

  const refreshDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === 'videoinput');
      setDevices(cams);
      if (!selectedDeviceId && cams.length) {
        // try to pick a likely front camera by label, else first
        const front = cams.find(c => /front|user/i.test(c.label));
        setSelectedDeviceId(front?.deviceId || cams[0].deviceId);
      }
    } catch {
      // ignore
    }
  };

  const waitForVideoFrames = async (timeoutMs = 3000) => {
    const start = Date.now();
    while (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
      if (Date.now() - start > timeoutMs) break;
      await new Promise(r => setTimeout(r, 50));
    }
    return videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0;
  };

  useEffect(() => {
    (async () => {
      await initializeFaceAPI();
      setMessage('Models loaded. Initializing camera...');
      await refreshDevices();
      // Inline auto-start to avoid lint dependency on handleStartCamera
      try {
        const videoEl = await ensureVideoElement();
        if (!videoEl) return;
        await startVideo(videoEl, { deviceId: selectedDeviceId || undefined });
        const gotFrames = await waitForVideoFrames(4000);
        setCameraActive(true);
        setMessage(gotFrames ? 'Camera active. Position your face in the frame.' : 'Camera started but no frames yet. If the view stays black, try switching camera or reload.');
        detectionIntervalRef.current = await startRealTimeDetection(
          videoRef.current,
          canvasRef.current,
          (detections) => {
            const detected = detections && detections.length > 0;
            lastFacesRef.current = detections || [];
            setFaceDetected(detected);
            setCameraActive(!!(videoRef.current && videoRef.current.srcObject));
            if (detected) setStabilizedFrames(prev => Math.min(prev + 1, STABILITY_THRESHOLD));
            else setStabilizedFrames(0);
          }
        );
        // now that permission granted, refresh devices to get labels
        await refreshDevices();
      } catch {
        // errors handled by startVideo or detection paths
      }
    })();
    return () => {
      cleanup();
    };
  }, []);

  // (rest of original implementation below will be re-enabled after hotfix)

  const initializeFaceAPI = async () => {
    try {
      setMessage('Loading face recognition models...');
      await loadModels();
      setMessage('Models loaded. Click Start Camera to begin.');
      setLoading(false);
      console.log('[FaceCapture] Models loaded, showing Start Camera button');
    } catch (error) {
      setMessage('Failed to load face recognition models. Please refresh.');
      toast.error('Failed to load face models. Check /models path and reload.');
      console.error(error);
    }
  };

  const handleStartCamera = async () => {
    try {
      console.log('[FaceCapture] Start Camera clicked');
      setMessage('Starting camera...');
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
        const msg = 'Camera API not available in this browser.';
        toast.error(msg);
        setMessage(msg);
        return;
      }
      if (window.isSecureContext === false && location.hostname !== 'localhost') {
        const msg = 'Camera requires a secure context (HTTPS) or localhost.';
        toast.error(msg);
        setMessage(msg);
        return;
      }
      const videoEl = await ensureVideoElement();
      if (!videoEl) {
        throw new Error('Camera not ready. Please wait and try again.');
      }
      console.log('[FaceCapture] Calling startVideo');
      await startVideo(videoEl);
      console.log('[FaceCapture] startVideo resolved, stream attached');
      const gotFrames = await waitForVideoFrames(4000);
      console.log('[FaceCapture] video ready?', gotFrames, 'size=', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight, 'readyState=', videoRef.current?.readyState);
      setCameraActive(true);
      setMessage(gotFrames ? 'Camera active. Position your face in the frame.' : 'Camera started but no frames yet. If the view stays black, try switching camera or reload.');
      
      // Start real-time detection
      detectionIntervalRef.current = await startRealTimeDetection(
        videoRef.current,
        canvasRef.current,
        (detections) => {
          const detected = detections && detections.length > 0;
          lastFacesRef.current = detections || [];
          setFaceDetected(detected);
          setCameraActive(!!(videoRef.current && videoRef.current.srcObject));
          if (detected) {
            setStabilizedFrames(prev => Math.min(prev + 1, STABILITY_THRESHOLD));
          } else {
            setStabilizedFrames(0);
          }
        }
      );
    } catch (error) {
      const msg =
        error?.name === 'NotAllowedError'
          ? 'Camera permission blocked. Please allow camera access in your browser.'
          : error?.message || 'Failed to start camera';
      setMessage(msg);
      toast.error(msg);
      console.error(error);
    }
  };

  const handleStopCamera = () => {
    cleanup();
    setCameraActive(false);
    setFaceDetected(false);
    setMessage('Camera stopped.');
  };

  const handleCapture = async () => {
    if (stabilizedFrames < STABILITY_THRESHOLD) {
      setMessage('Hold steady. Ensure good lighting and follow the rules.');
      toast.warning('No face detected');
      return;
    }

    try {
      setDetecting(true);
      setMessage('Capturing face...');
      // Prefer last real-time detection embedding to avoid empty results
      let descriptor = null;
      // small pause to let the next detection tick complete
      await new Promise((r) => setTimeout(r, 200));
      let last = lastFacesRef.current && lastFacesRef.current[0];
      if (last && (last.embedding?.length || last.descriptor?.length)) {
        descriptor = Array.from(last.embedding || last.descriptor);
      } else {
        const res = await detectFace(videoRef.current);
        descriptor = res?.descriptor;
      }
      
      if (!descriptor || descriptor.length === 0) {
        throw new Error('Failed to extract face features. Please try again.');
      }

      const faceImage = captureFaceImage(videoRef.current);
      
      if (!faceImage) {
        throw new Error('Failed to capture face image. Please try again.');
      }

      // Execute server-side action depending on mode
      if (mode === 'register') {
        setMessage('Registering face...');
        let resp;
        if (registrationToken) {
          // Tokenized flow: finalize user creation only after face capture
          resp = await faceAPI.registerAndCreate({
            registration_token: registrationToken,
            faceDescriptor: Array.from(descriptor),
            faceImage
          });
        } else {
          // Legacy flow: attach face to existing account
          resp = await faceAPI.registerFace({ faceDescriptor: Array.from(descriptor), faceImage });
        }
        if (resp?.data?.success) {
          toast.success('Face registered successfully');
        } else {
          throw new Error(resp?.data?.message || 'Face registration failed');
        }
      } else if (mode === 'verify') {
        setMessage('Verifying face...');
        const resp = await faceAPI.verifyForVoting({ faceDescriptor: Array.from(descriptor) });
        if (resp?.data?.success) {
          toast.success('Face verified');
        } else {
          throw new Error(resp?.data?.message || 'Face verification failed');
        }
      }

      setMessage('Face captured successfully!');
      // Notify parent after success
      if (onCapture) {
        onCapture({
          descriptor: Array.from(descriptor),
          image: faceImage
        });
      }

      cleanup();
    } catch (error) {
      const msg = error.message || 'Failed to capture face. Please try again.';
      setMessage(msg);
      toast.error(msg);
      console.error('Face capture error:', error);
      setDetecting(false);
    }
  };

  const cleanup = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (videoRef.current) {
      stopVideo(videoRef.current);
    }
  };

  const handleCancel = () => {
    cleanup();
    if (onCancel) {
      onCancel();
    }
  };

  if (loading) {
    return loaderValid ? (
      <Loader message="Loading face recognition..." />
    ) : (
      <div style={{ padding: 16, background: '#220000', color: '#fff', borderRadius: 8 }}>
        <h3>Loading…</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        {!loaderValid ? (
          <div style={{ padding: 16, background: '#220000', color: '#fff', borderRadius: 8 }}>
            <h3>Critical: Loader component failed to import</h3>
            <ul>
              <li>Ensure <code>Frontend/src/components/Loader.jsx</code> has <code>export default Loader;</code></li>
              <li>Ensure this file imports it as <code>import Loader from './Loader';</code></li>
            </ul>
          </div>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'register' ? 'Register Your Face' : 'Verify Your Face'}</CardTitle>
            <CardDescription>Use bright, even lighting and center your face.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
                <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: 'auto', display: 'block', transform: mirrored ? 'scaleX(-1)' : 'none' }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => restartWithSelectedDevice(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 220 }}
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i+1}`}</option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={refreshDevices}>Refresh</Button>
                <Button type="button" variant="secondary" onClick={() => setMirrored(m => !m)}>{mirrored ? 'Unmirror' : 'Mirror'}</Button>
                {!cameraActive ? (
                  <Button type="button" onClick={handleStartCamera} size="lg">Start Camera</Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleCapture}
                      disabled={!faceDetected || detecting || stabilizedFrames < STABILITY_THRESHOLD}
                      size="lg"
                    >
                      {detecting ? 'Capturing...' : (mode === 'register' ? 'Register Face' : 'Verify Face')}
                    </Button>
                    <Button type="button" onClick={handleStopCamera} variant="secondary">Stop Camera</Button>
                  </>
                )}
                <Button type="button" onClick={handleCancel} variant="outline">Cancel</Button>
              </div>

              <Separator />
              <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                Tip: Use a bright room and a light background. Center your face and hold steady.
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#555', textAlign: 'center' }}>
                cameraActive: {String(cameraActive)} | faceDetected: {String(faceDetected)} | stabilized: {stabilizedFrames}/{STABILITY_THRESHOLD}
              </div>
              {message && (
                <div style={{ fontSize: 12, color: '#444', textAlign: 'center' }}>{message}</div>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
