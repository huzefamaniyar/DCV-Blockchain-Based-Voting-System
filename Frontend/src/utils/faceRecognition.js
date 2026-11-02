import * as faceapi from 'face-api.js';
import { FACE_API_CONFIG } from '../config';

let modelsLoaded = false;

const getModelUrl = () => (FACE_API_CONFIG.modelUrl || '/models').replace(/\/$/, '');

// Load face-api.js models from /models (or FACE_API_CONFIG.modelUrl)
export const loadModels = async () => {
  if (modelsLoaded) return true;
  const base = getModelUrl();
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(base),
      faceapi.nets.faceLandmark68Net.loadFromUri(base),
      faceapi.nets.faceRecognitionNet.loadFromUri(base),
      // optional but harmless
      faceapi.nets.faceExpressionNet.loadFromUri(base).catch(() => {}),
    ]);
    modelsLoaded = true;
    console.log('✅ face-api.js models loaded from', base);
    return true;
  } catch (err) {
    console.error('❌ Error loading face-api.js models:', err);
    throw err;
  }
};

// Detect single face and get descriptor using face-api.js
export const detectFace = async (videoElement) => {
  if (!videoElement) throw new Error('Video element not available');
  const options = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 });
  const detection = await faceapi
    .detectSingleFace(videoElement, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection || !detection.descriptor) {
    throw new Error('Failed to extract face features');
  }

  const descriptor = Array.from(detection.descriptor);
  return { descriptor, detection };
};

// Start video stream
export const startVideo = async (videoElement, options = {}) => {
  const tryGetUserMedia = async (constraints) => navigator.mediaDevices.getUserMedia(constraints);

  // If a specific deviceId is requested, try it first
  if (options.deviceId) {
    try {
      const stream = await tryGetUserMedia({ video: { deviceId: { exact: options.deviceId } }, audio: false });
      if (videoElement) {
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('autoplay', '');
        videoElement.muted = true;
        videoElement.srcObject = stream;
      }
      await new Promise((resolve) => { videoElement.onloadedmetadata = () => resolve(); });
      try { await videoElement.play(); } catch (e) { console.warn('play() failed after deviceId selection:', e); }
      return stream;
    } catch (err) {
      console.warn('Specified deviceId failed, falling back to generic constraints:', err);
    }
  }

  const attempts = [
    // Front/selfie camera
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'user' } }, audio: false },
    { video: { facingMode: { ideal: 'user' } }, audio: false },
    // Back/environment camera (mobile)
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    // Any available camera
    { video: true, audio: false },
  ];

  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await tryGetUserMedia(constraints);
      // Prepare element for reliable inline playback
      if (videoElement) {
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('autoplay', '');
        videoElement.muted = true;
        videoElement.srcObject = stream;
      }
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => resolve();
      });
      try {
        await videoElement.play();
      } catch (playErr) {
        console.warn('Video play() failed initially, will rely on autoplay policies:', playErr);
      }
      return stream;
    } catch (err) {
      lastError = err;
      // Legacy fallback for older browsers
      if (navigator.getUserMedia) {
        try {
          const stream = await new Promise((resolve, reject) => {
            navigator.getUserMedia(constraints, resolve, reject);
          });
          if (videoElement) {
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('autoplay', '');
            videoElement.muted = true;
            videoElement.srcObject = stream;
          }
          await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => resolve();
          });
          try { await videoElement.play(); } catch (e) { console.warn('play() failed after legacy getUserMedia:', e); }
          return stream;
        } catch (legacyErr) {
          lastError = legacyErr;
        }
      }
    }
  }

  // As a final fallback: enumerate devices and try each video input explicitly
  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      for (const dev of videoInputs) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: dev.deviceId } }, audio: false });
          if (videoElement) {
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('autoplay', '');
            videoElement.muted = true;
            videoElement.srcObject = stream;
          }
          await new Promise((resolve) => { videoElement.onloadedmetadata = () => resolve(); });
          try { await videoElement.play(); } catch (e) { console.warn('play() failed after deviceId attempt:', e); }
          return stream;
        } catch (devErr) {
          lastError = devErr;
        }
      }
    }
  } catch (enumErr) {
    lastError = enumErr;
  }

  console.error('Camera access error:', lastError);
  if (lastError && lastError.name === 'NotAllowedError') {
    throw new Error('Camera permission blocked. Please allow camera access in your browser.');
  }
  if (lastError && (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError')) {
    throw new Error('Camera is in use by another application. Please close other apps (Zoom/Teams/Meet) and retry.');
  }
  if (lastError && lastError.name === 'OverconstrainedError') {
    throw new Error('Camera constraints not supported by your device. Try a different camera or remove constraints.');
  }
  throw new Error('Failed to access camera. Please allow camera permissions.');
};

// Stop video stream
export const stopVideo = (videoElement) => {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
};

// Draw face detection on canvas
 export const drawDetections = (videoElement, canvasElement, faces) => {
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  if (!width || !height) return;
  if (canvasElement.width !== width) canvasElement.width = width;
  if (canvasElement.height !== height) canvasElement.height = height;

  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (!faces || faces.length === 0) return;
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  for (const f of faces) {
    const box = f.box; // { x, y, width, height }
    if (!box) continue;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
};

// Real-time face detection
export const startRealTimeDetection = async (videoElement, canvasElement, onDetection) => {
  if (!videoElement || !canvasElement) return null;

  const ensureDimensions = () => {
    const width = videoElement.videoWidth || videoElement.clientWidth || 640;
    const height = videoElement.videoHeight || videoElement.clientHeight || 480;
    if (!width || !height) return null;
    canvasElement.width = width;
    canvasElement.height = height;
    return { width, height };
  };

  const options = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 });

  const detectInterval = setInterval(async () => {
    if (!videoElement.srcObject) {
      clearInterval(detectInterval);
      return;
    }
    const size = ensureDimensions();
    if (!size) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, options)
        .withFaceLandmarks();

      const resized = faceapi.resizeResults(detections, size);

      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      faceapi.draw.drawDetections(canvasElement, resized);

      if (onDetection) onDetection(resized);
    } catch {
      // log once in a while if needed
      // console.error('Detection error');
    }
  }, 150);

  return detectInterval;
};

// Capture face image as base64
export const captureFaceImage = (videoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Calculate Euclidean distance
export const calculateDistance = (descriptor1, descriptor2) => {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
};

// Check if models are loaded
export const areModelsLoaded = () => modelsLoaded;

export default {
  loadModels,
  detectFace,
  startVideo,
  stopVideo,
  drawDetections,
  startRealTimeDetection,
  captureFaceImage,
  calculateDistance,
  areModelsLoaded
};
