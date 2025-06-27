import { useState, useRef, useEffect } from 'react';
import { Pose } from '@mediapipe/pose';
import { CameraState, PoseResults, PoseLandmark } from '../types/measurements';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
  facingModeHint?: 'user' | 'environment';
}

export const useCamera = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    stream: null,
    error: null,
    isRecording: false,
    currentStep: 0
  });
  
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const [currentPoseResults, setCurrentPoseResults] = useState<PoseResults | null>(null);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const initializePose = async () => {
      try {
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          setCurrentPoseResults({
            poseLandmarks: results.poseLandmarks || [],
            poseWorldLandmarks: results.poseWorldLandmarks || [],
            segmentationMask: results.segmentationMask
          });
        });

        poseRef.current = pose;
      } catch (error) {
        console.error('Failed to initialize MediaPipe Pose:', error);
        setCameraState(prev => ({
          ...prev,
          error: 'Failed to initialize pose detection. Please refresh and try again.'
        }));
      }
    };

    initializePose();
  }, []);

  // Enumerate available cameras with facing mode hints
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => {
          const label = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
          let facingModeHint: 'user' | 'environment' | undefined;
          
          // Infer facing mode from device label
          const lowerLabel = label.toLowerCase();
          if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('selfie')) {
            facingModeHint = 'user';
          } else if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
            facingModeHint = 'environment';
          }
          
          return {
            deviceId: device.deviceId,
            label,
            kind: device.kind,
            facingModeHint
          };
        });
      
      setAvailableCameras(videoDevices);
      
      // Set default camera (prefer front camera if available)
      if (videoDevices.length > 0 && !selectedCameraId) {
        const frontCamera = videoDevices.find(device => 
          device.facingModeHint === 'user' ||
          device.label.toLowerCase().includes('front') || 
          device.label.toLowerCase().includes('user')
        );
        setSelectedCameraId(frontCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
      setCameraState(prev => ({
        ...prev,
        error: 'Failed to access camera devices. Please check permissions.'
      }));
    }
  };

  // Initialize camera enumeration on mount
  useEffect(() => {
    enumerateCameras();
  }, []);

  const startCamera = async (deviceId?: string) => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));
      
      // Stop existing stream if any
      if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
      }

      const cameraId = deviceId || selectedCameraId;
      const selectedCamera = availableCameras.find(camera => camera.deviceId === cameraId);
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(cameraId ? { 
            deviceId: { exact: cameraId },
            ...(selectedCamera?.facingModeHint && { facingMode: selectedCamera.facingModeHint })
          } : { facingMode: 'user' })
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start pose detection when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (poseRef.current && videoRef.current) {
            const processFrame = async () => {
              if (videoRef.current && poseRef.current && cameraState.isActive) {
                await poseRef.current.send({ image: videoRef.current });
                requestAnimationFrame(processFrame);
              }
            };
            processFrame();
          }
        };
      }

      setCameraState(prev => ({
        ...prev,
        isActive: true,
        stream,
        error: null
      }));

      // Update selected camera ID if a specific device was used
      if (deviceId) {
        setSelectedCameraId(deviceId);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraState(prev => ({
        ...prev,
        error: 'Camera access denied or device not available. Please check permissions and try again.'
      }));
    }
  };

  const switchCamera = async (deviceId: string) => {
    await startCamera(deviceId);
  };

  const stopCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
    }
    
    setCameraState({
      isActive: false,
      stream: null,
      error: null,
      isRecording: false,
      currentStep: 0
    });
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const capturePoseData = (stepId: string) => {
    const imageData = captureFrame();
    if (!imageData || !currentPoseResults?.poseLandmarks) {
      return null;
    }

    return {
      imageData,
      landmarks: currentPoseResults.poseLandmarks,
      worldLandmarks: currentPoseResults.poseWorldLandmarks,
      stepId,
      timestamp: new Date()
    };
  };

  const startRecording = () => {
    setCameraState(prev => ({ ...prev, isRecording: true }));
  };

  const stopRecording = () => {
    setCameraState(prev => ({ ...prev, isRecording: false }));
  };

  useEffect(() => {
    return () => {
      if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    cameraState,
    setCameraState,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFrame,
    capturePoseData,
    currentPoseResults,
    startRecording,
    stopRecording,
    availableCameras,
    selectedCameraId,
    switchCamera,
    enumerateCameras
  };
};