import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const DiagnosticTest = () => {
  const [results, setResults] = useState({
    modelsAccessible: null,
    cameraAvailable: null,
    faceApiLoaded: null
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    // Test 1: Check if models are accessible
    try {
      const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
      setResults(prev => ({ ...prev, modelsAccessible: response.ok }));
    } catch (err) {
      setResults(prev => ({ ...prev, modelsAccessible: false }));
    }

    // Test 2: Check camera availability
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setResults(prev => ({ ...prev, cameraAvailable: true }));
    } catch (err) {
      setResults(prev => ({ ...prev, cameraAvailable: false }));
    }

    // Test 3: Check if face-api can be imported
    try {
      const faceapi = await import('face-api.js');
      setResults(prev => ({ ...prev, faceApiLoaded: !!faceapi }));
    } catch (err) {
      setResults(prev => ({ ...prev, faceApiLoaded: false }));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Face Recognition Diagnostic Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Test Results:</h2>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Models Accessible:</strong>{' '}
          {results.modelsAccessible === null ? '⏳ Testing...' : 
           results.modelsAccessible ? '✅ YES' : '❌ NO'}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Camera Available:</strong>{' '}
          {results.cameraAvailable === null ? '⏳ Testing...' : 
           results.cameraAvailable ? '✅ YES' : '❌ NO'}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Face-API Loaded:</strong>{' '}
          {results.faceApiLoaded === null ? '⏳ Testing...' : 
           results.faceApiLoaded ? '✅ YES' : '❌ NO'}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li>If Models Accessible is ❌: Models not in correct location or dev server not serving them</li>
          <li>If Camera Available is ❌: Camera permission blocked or camera in use by another app</li>
          <li>If Face-API Loaded is ❌: face-api.js package not installed or import error</li>
        </ul>
      </div>

      <button 
        onClick={runDiagnostics}
        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}
      >
        Re-run Tests
      </button>
    </div>
  );
};

export default DiagnosticTest;
