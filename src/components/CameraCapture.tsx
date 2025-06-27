import React, { useEffect, useState } from 'react';
import { Camera, RotateCcw, CheckCircle, AlertCircle, Clock, SwitchCamera, X } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { PoseStep, CapturedPoseData } from '../types/measurements';

interface CameraCaptureProps {
  onComplete: (poseData: CapturedPoseData[]) => void;
  onBack: () => void;
}

const poseSteps: PoseStep[] = [
  {
    id: 'front',
    title: 'Front View',
    description: 'Stand facing the camera',
    instruction: 'Stand straight with arms at your sides, looking directly at the camera',
    duration: 3000,
    angle: 0,
    isCompleted: false
  },
  {
    id: 'side-right',
    title: 'Right Side',
    description: 'Turn 90° to your right',
    instruction: 'Turn to show your right side profile, arms at your sides',
    duration: 3000,
    angle: 90,
    isCompleted: false
  },
  {
    id: 'back',
    title: 'Back View',
    description: 'Turn to show your back',
    instruction: 'Turn completely around to show your back, arms at your sides',
    duration: 3000,
    angle: 180,
    isCompleted: false
  },
  {
    id: 'side-left',
    title: 'Left Side',
    description: 'Turn 90° to your left',
    instruction: 'Turn to show your left side profile, arms at your sides',
    duration: 3000,
    angle: 270,
    isCompleted: false
  },
  {
    id: 'front-arms',
    title: 'Arms Extended',
    description: 'Face camera with arms out',
    instruction: 'Face the camera and extend both arms horizontally',
    duration: 3000,
    angle: 0,
    isCompleted: false
  }
];

const timerOptions = [
  { value: 0, label: 'No Timer' },
  { value: 3, label: '3 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' }
];

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onComplete, onBack }) => {
  const { 
    cameraState, 
    videoRef, 
    canvasRef, 
    startCamera, 
    stopCamera, 
    capturePoseData, 
    currentPoseResults,
    availableCameras,
    selectedCameraId,
    switchCamera
  } = useCamera();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [capturedPoseData, setCapturedPoseData] = useState<CapturedPoseData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedTimerDuration, setSelectedTimerDuration] = useState(3);
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCapturing) {
      handleCapture();
    }
  }, [countdown, isCapturing]);

  const startCapture = () => {
    setIsCapturing(true);
    if (selectedTimerDuration === 0) {
      setCountdown(0);
    } else {
      setCountdown(selectedTimerDuration);
    }
  };

  const handleCapture = () => {
    const currentStep = poseSteps[currentStepIndex];
    const poseData = capturePoseData(currentStep.id);
    
    if (poseData) {
      const newPoseData = [...capturedPoseData, poseData];
      setCapturedPoseData(newPoseData);
      
      if (currentStepIndex < poseSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setIsCapturing(false);
      } else {
        // All steps completed
        stopCamera();
        onComplete(newPoseData);
      }
    } else {
      // Handle error - no pose detected
      setIsCapturing(false);
      // You could show an error message here
    }
  };

  const retakeCurrentStep = () => {
    setIsCapturing(false);
    setCountdown(0);
  };

  const handleCameraSwitch = async (deviceId: string) => {
    await switchCamera(deviceId);
    setShowCameraSelector(false);
  };

  const handleExit = () => {
    stopCamera();
    onBack();
  };

  const currentStep = poseSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / poseSteps.length) * 100;
  const isPoseDetected = currentPoseResults?.poseLandmarks && currentPoseResults.poseLandmarks.length > 0;

  const getTimerButtonText = () => {
    if (selectedTimerDuration === 0) {
      return 'Capture Now';
    }
    return `Start ${selectedTimerDuration}s Timer`;
  };

  const getCurrentCameraLabel = () => {
    const currentCamera = availableCameras.find(camera => camera.deviceId === selectedCameraId);
    return currentCamera?.label || 'Camera';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Body Measurement Scan</h2>
            <p className="text-sm text-gray-300">Step {currentStepIndex + 1} of {poseSteps.length}</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Camera Selector */}
            {availableCameras.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowCameraSelector(!showCameraSelector)}
                  disabled={isCapturing}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline text-sm">{getCurrentCameraLabel()}</span>
                </button>
                
                {showCameraSelector && (
                  <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 min-w-48">
                    <div className="p-2">
                      <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-600 mb-1">
                        Select Camera
                      </div>
                      {availableCameras.map((camera) => (
                        <button
                          key={camera.deviceId}
                          onClick={() => handleCameraSwitch(camera.deviceId)}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            camera.deviceId === selectedCameraId
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {camera.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Exit Button */}
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              title="Exit and turn off camera"
            >
              <X className="w-4 h-4 mr-2" />
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-black/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            {poseSteps.map((step, index) => (
              <span 
                key={step.id}
                className={index <= currentStepIndex ? 'text-orange-400' : 'text-gray-500'}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Camera View */}
        <div className="flex-1 relative">
          <div className="h-full flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              {cameraState.error ? (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-300 mb-4">{cameraState.error}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-auto rounded-lg shadow-2xl"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Countdown Overlay */}
                  {countdown > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-6xl font-bold text-white animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                  
                  {/* Pose Guide Overlay */}
                  <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-semibold text-white mb-1">{currentStep.title}</h3>
                    <p className="text-sm text-gray-300">{currentStep.instruction}</p>
                    <div className="flex items-center justify-center mt-2">
                      <div className={`w-3 h-3 rounded-full mr-2 ${isPoseDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-gray-300">
                        {isPoseDetected ? 'Pose Detected' : 'No Pose Detected'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="lg:w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Current Pose</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-3 ${isPoseDetected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-white font-medium">{currentStep.title}</span>
                </div>
                <p className="text-sm text-gray-300">{currentStep.description}</p>
              </div>
            </div>

            {/* Camera Info */}
            {availableCameras.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <SwitchCamera className="w-5 h-5 mr-2" />
                  Camera
                </h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-300 mb-2">Active Camera:</div>
                  <div className="text-white font-medium text-sm truncate">
                    {getCurrentCameraLabel()}
                  </div>
                  {availableCameras.length > 1 && (
                    <div className="text-xs text-gray-400 mt-2">
                      {availableCameras.length} cameras available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timer Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Timer Settings
              </h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="block text-sm text-gray-300 mb-2">Capture Timer</label>
                <select
                  value={selectedTimerDuration}
                  onChange={(e) => setSelectedTimerDuration(Number(e.target.value))}
                  disabled={isCapturing}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {timerOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedTimerDuration === 0 
                    ? 'Photo will be taken immediately' 
                    : `${selectedTimerDuration} second countdown before capture`
                  }
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Progress</h3>
              <div className="space-y-2">
                {poseSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    ) : index === currentStepIndex ? (
                      <div className="w-5 h-5 border-2 border-orange-500 rounded-full mr-3 animate-pulse"></div>
                    ) : (
                      <div className="w-5 h-5 border border-gray-500 rounded-full mr-3"></div>
                    )}
                    <span className={`text-sm ${
                      index <= currentStepIndex ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {!isCapturing ? (
                <button
                  onClick={startCapture}
                  disabled={!cameraState.isActive || !isPoseDetected}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {getTimerButtonText()}
                </button>
              ) : (
                <button
                  onClick={retakeCurrentStep}
                  className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Cancel
                </button>
              )}
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Ensure good lighting</p>
              <p>• Stand 6 feet from camera</p>
              <p>• Wear form-fitting clothes</p>
              <p>• Keep arms visible</p>
              <p>• Wait for pose detection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close camera selector */}
      {showCameraSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCameraSelector(false)}
        />
      )}
    </div>
  );
};