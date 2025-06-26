export interface BodyMeasurements {
  // Upper Body
  neckCircumference: number;
  shoulderWidth: number;
  chestCircumference: number;
  bustCircumference?: number;
  underbustCircumference?: number;
  waistCircumference: number;
  armLength: number;
  bicepCircumference: number;
  wristCircumference: number;
  shirtLength: number;
  
  // Lower Body
  hipCircumference: number;
  thighCircumference: number;
  inseam: number;
  outseam: number;
  kneeCircumference: number;
  calfCircumference: number;
  ankleCircumference: number;
  
  // General
  height: number;
  weight?: number;
  
  // Metadata
  confidence: number;
  timestamp: Date;
  units: 'inches' | 'cm';
}

export interface SizingRecommendation {
  category: string;
  size: string;
  fit: 'tight' | 'regular' | 'loose';
  confidence: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  measurements: BodyMeasurements[];
  preferences: {
    units: 'inches' | 'cm';
    fit: 'tight' | 'regular' | 'loose';
  };
  createdAt: Date;
}

export interface PoseStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  duration: number;
  angle: number;
  isCompleted: boolean;
}

export interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
  isRecording: boolean;
  currentStep: number;
}

// MediaPipe Pose types
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks: PoseLandmark[];
  poseWorldLandmarks?: PoseLandmark[];
  segmentationMask?: ImageData;
}

export interface CapturedPoseData {
  imageData: string;
  landmarks: PoseLandmark[];
  worldLandmarks?: PoseLandmark[];
  stepId: string;
  timestamp: Date;
}

// Supabase database types
export interface DatabaseProfile {
  id: string;
  name: string;
  email?: string;
  preferences: {
    units: 'inches' | 'cm';
    fit: 'tight' | 'regular' | 'loose';
  };
  created_at: string;
  updated_at: string;
}

export interface DatabaseMeasurement {
  id: string;
  profile_id: string;
  measurements: BodyMeasurements;
  raw_landmarks: CapturedPoseData[];
  created_at: string;
}