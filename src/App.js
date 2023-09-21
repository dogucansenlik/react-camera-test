import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const savedVideoRef = useRef(null);
  const [panel, setPanel] = useState('');
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [faceDetectionStatus, setFaceDetectionStatus] = useState('not_started')
  const [timeRemaining, setTimeRemaining] = useState(5);
  const recordedChunks = useRef([]);

  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    }

    loadModels();
  }, []);

  const onFaceDetection = async () => {
    const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }));
    setFaceDetectionStatus('running')
    setIsFaceDetected((detection))
  }

  const checkFacePresence = (videoRef) => {
    setInterval(async () => {
      onFaceDetection()
    }, 1000);
  }

  const requestFaceCameraPermission = async () => {
    setPanel('face_detection')
    const constraints = {
      video: {
        facingMode: "user",
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        setFaceDetectionStatus('started')
        videoRef.current.srcObject = stream;
        onFaceDetection()
        checkFacePresence(videoRef);
      }
    } catch (error) {
      console.error('Camera permission error:', error);
    }
  };

  const requestBackCameraPermission = async () => {
    setPanel('room_scan')
    const constraints = {
      video: {
        facingMode: "environment",
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(stream, options);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        savedVideoRef.current.src = videoUrl;
      };

      mediaRecorder.start();

      const intervalId = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime >= 1) {
            return prevTime - 1;
          } else {
            clearInterval(intervalId); // Sayaç 0'a ulaştığında interval'i durdur
            return 0;
          }
        });
      }, 1000);

      setTimeout(() => {
        mediaRecorder.stop();
      }, timeRemaining * 1000);

    } catch (error) {
      console.error('Camera permission error:', error);
    }
  };

  return (
    <div className="App">
      <div className="button-container">
        <button onClick={requestFaceCameraPermission}>Face detection</button>
        <button onClick={requestBackCameraPermission}>Room scan</button>
      </div>
      {panel === 'face_detection' && (
        <>
          <h2>Face Detection</h2>
          <div className="video-container"><video ref={videoRef} muted playsInline autoPlay={true} width="250" /></div>
          {faceDetectionStatus === 'running' && (<p>{isFaceDetected ? 'Your face detected' : 'Your face not detected!'}</p>)}
          {faceDetectionStatus === 'started' && (<p>Detecting...</p>)}
        </>
      )}
      {panel === 'room_scan' && (
        <>
          <h2>Room Scan</h2>
          {timeRemaining > 0 && (
            <>
              <div className="video-container"><video ref={videoRef} muted playsInline autoPlay={true} width="250" /></div>
              <p>Recording...</p>
              <p>Time remaning: {timeRemaining}</p>
            </>
          )}
          {timeRemaining === 0 && (
            <>
              <div className="video-container"><video ref={savedVideoRef} controls width="250" /></div>
              <p>Recorded.</p>
            </>
          )}


        </>
      )}
    </div>
  );
}

export default App;
