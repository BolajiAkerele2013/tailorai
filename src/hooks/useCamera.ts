import { useState, useRef, useEffect } from 'react';
import { Pose } from '@mediapipe/pose';
import { CameraState, PoseResults, PoseLandmark } from '../types/measurements';

export const useCamera = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    stream: null,
    error: null,
    isRecording: false,
    currentStep: 0
  });
  
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

  const startCamera = async () => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start pose detection when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (poseRef.current && videoRef.current) {
            const processFrame = async () => {
              if (videoRef.current && poseRef.current) {
                await poseRef.current.send({ image: videoRef.current });
                if (cameraState.isActive) {
                  requestAnimationFrame(processFrame);
                }
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
    } catch (error) {
      setCameraState(prev => ({
        ...prev,
        error: 'Camera access denied. Please allow camera permissions.'
      }));
    }
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
    stopRecording
  };
};