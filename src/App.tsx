import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CameraCapture } from './components/CameraCapture';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { useMeasurements } from './hooks/useMeasurements';
import { BodyMeasurements, SizingRecommendation, CapturedPoseData } from './types/measurements';

type AppState = 'welcome' | 'camera' | 'processing' | 'results';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [finalMeasurements, setFinalMeasurements] = useState<BodyMeasurements | null>(null);
  const [recommendations, setRecommendations] = useState<SizingRecommendation[]>([]);
  const [allCapturedPoseData, setAllCapturedPoseData] = useState<CapturedPoseData[]>([]);
  
  const { 
    measurements, 
    isProcessing, 
    processingProgress, 
    processMeasurements, 
    generateSizingRecommendations 
  } = useMeasurements();

  const handleStart = () => {
    setCurrentState('camera');
  };

  const handleCameraComplete = async (poseData: CapturedPoseData[]) => {
    setCurrentState('processing');
    
    try {
      const processedMeasurements = await processMeasurements(poseData);
      const sizingRecs = generateSizingRecommendations(processedMeasurements);
      
      setFinalMeasurements(processedMeasurements);
      setRecommendations(sizingRecs);
      setAllCapturedPoseData(poseData); // Store the raw pose data
      setCurrentState('results');
    } catch (error) {
      console.error('Error processing measurements:', error);
      // In a real app, you'd show an error state
      setCurrentState('welcome');
    }
  };

  const handleRestart = () => {
    setCurrentState('welcome');
    setFinalMeasurements(null);
    setRecommendations([]);
    setAllCapturedPoseData([]);
  };

  const handleBackToWelcome = () => {
    setCurrentState('welcome');
  };

  return (
    <div className="App">
      {currentState === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}
      
      {currentState === 'camera' && (
        <CameraCapture 
          onComplete={handleCameraComplete}
          onBack={handleBackToWelcome}
        />
      )}
      
      {currentState === 'processing' && (
        <ProcessingScreen progress={processingProgress} />
      )}
      
      {currentState === 'results' && finalMeasurements && (
        <ResultsScreen 
          measurements={finalMeasurements}
          recommendations={recommendations}
          rawPoseData={allCapturedPoseData}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;