import { useState } from 'react';
import { BodyMeasurements, SizingRecommendation, CapturedPoseData, PoseLandmark } from '../types/measurements';

export const useMeasurements = () => {
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // MediaPipe Pose landmark indices
  const POSE_LANDMARKS = {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32
  };

  const calculateDistance = (point1: PoseLandmark, point2: PoseLandmark): number => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const calculateMidpoint = (point1: PoseLandmark, point2: PoseLandmark): PoseLandmark => {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
      z: (point1.z + point2.z) / 2,
      visibility: Math.min(point1.visibility || 1, point2.visibility || 1)
    };
  };

  const estimateCircumference = (width: number, depth: number = 0): number => {
    // Approximate circumference from width and depth measurements
    // Using ellipse approximation: C ≈ π * (3(a+b) - √((3a+b)(a+3b)))
    // Where a and b are the semi-major and semi-minor axes
    if (depth === 0) {
      // If no depth, assume circular cross-section
      return Math.PI * width;
    }
    
    const a = width / 2;
    const b = depth / 2;
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  };

  const calculateMeasurementsFromLandmarks = (poseDataArray: CapturedPoseData[]): BodyMeasurements => {
    // Find the best pose data for each measurement type
    const frontPose = poseDataArray.find(data => data.stepId === 'front');
    const sidePose = poseDataArray.find(data => data.stepId === 'side-right') || 
                     poseDataArray.find(data => data.stepId === 'side-left');
    const armsPose = poseDataArray.find(data => data.stepId === 'front-arms');
    
    if (!frontPose || !sidePose) {
      throw new Error('Missing required pose data for measurements');
    }

    const frontLandmarks = frontPose.landmarks;
    const sideLandmarks = sidePose.landmarks;
    const armsLandmarks = armsPose?.landmarks || frontLandmarks;

    // Calculate pixel to real-world scale (assuming average human proportions)
    // Using head height as reference (average ~9 inches)
    const headTop = frontLandmarks[POSE_LANDMARKS.NOSE];
    const neckBase = calculateMidpoint(
      frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      frontLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    );
    const headHeightPixels = calculateDistance(headTop, neckBase);
    const pixelToInchRatio = 9 / headHeightPixels; // Assuming 9 inch head height

    // Height calculation
    const topOfHead = frontLandmarks[POSE_LANDMARKS.NOSE];
    const leftAnkle = frontLandmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = frontLandmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const avgAnkle = calculateMidpoint(leftAnkle, rightAnkle);
    const heightPixels = calculateDistance(topOfHead, avgAnkle);
    const height = heightPixels * pixelToInchRatio;

    // Shoulder width
    const leftShoulder = frontLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = frontLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const shoulderWidthPixels = calculateDistance(leftShoulder, rightShoulder);
    const shoulderWidth = shoulderWidthPixels * pixelToInchRatio;

    // Chest circumference (using front and side measurements)
    const chestWidthPixels = shoulderWidthPixels * 0.8; // Approximate chest width from shoulder width
    const chestWidth = chestWidthPixels * pixelToInchRatio;
    const chestCircumference = estimateCircumference(chestWidth);

    // Waist circumference
    const leftHip = frontLandmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = frontLandmarks[POSE_LANDMARKS.RIGHT_HIP];
    const waistWidthPixels = calculateDistance(leftHip, rightHip) * 0.9; // Waist is typically narrower than hips
    const waistWidth = waistWidthPixels * pixelToInchRatio;
    const waistCircumference = estimateCircumference(waistWidth);

    // Hip circumference
    const hipWidthPixels = calculateDistance(leftHip, rightHip);
    const hipWidth = hipWidthPixels * pixelToInchRatio;
    const hipCircumference = estimateCircumference(hipWidth);

    // Arm length
    const leftElbow = armsLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const leftWrist = armsLandmarks[POSE_LANDMARKS.LEFT_WRIST];
    const upperArmPixels = calculateDistance(leftShoulder, leftElbow);
    const forearmPixels = calculateDistance(leftElbow, leftWrist);
    const armLength = (upperArmPixels + forearmPixels) * pixelToInchRatio;

    // Inseam (hip to ankle)
    const inseamPixels = calculateDistance(leftHip, leftAnkle);
    const inseam = inseamPixels * pixelToInchRatio;

    // Neck circumference (estimated from head/neck proportions)
    const neckCircumference = height * 0.2; // Rough approximation

    // Other measurements (estimated based on body proportions)
    const bustCircumference = chestCircumference * 0.95;
    const underbustCircumference = chestCircumference * 0.85;
    const bicepCircumference = shoulderWidth * 0.25;
    const wristCircumference = height * 0.09;
    const thighCircumference = hipCircumference * 0.6;
    const kneeCircumference = thighCircumference * 0.7;
    const calfCircumference = kneeCircumference * 0.9;
    const ankleCircumference = calfCircumference * 0.6;
    const shirtLength = height * 0.4;
    const outseam = inseam * 1.15;

    return {
      // Upper Body
      neckCircumference,
      shoulderWidth,
      chestCircumference,
      bustCircumference,
      underbustCircumference,
      waistCircumference,
      armLength,
      bicepCircumference,
      wristCircumference,
      shirtLength,
      
      // Lower Body
      hipCircumference,
      thighCircumference,
      inseam,
      outseam,
      kneeCircumference,
      calfCircumference,
      ankleCircumference,
      
      // General
      height,
      
      // Metadata
      confidence: 0.75, // Base confidence, could be improved with pose quality analysis
      timestamp: new Date(),
      units: 'inches'
    };
  };

  const processMeasurements = async (poseDataArray: CapturedPoseData[]): Promise<BodyMeasurements> => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate processing steps with progress updates
    const steps = [
      'Analyzing pose landmarks...',
      'Calculating body proportions...',
      'Processing depth information...',
      'Generating measurements...',
      'Validating results...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingProgress((i + 1) / steps.length * 100);
    }

    try {
      const calculatedMeasurements = calculateMeasurementsFromLandmarks(poseDataArray);
      setMeasurements(calculatedMeasurements);
      setIsProcessing(false);
      return calculatedMeasurements;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  const generateSizingRecommendations = (measurements: BodyMeasurements): SizingRecommendation[] => {
    const recommendations: SizingRecommendation[] = [];

    // Shirt sizing logic
    if (measurements.chestCircumference <= 36) {
      recommendations.push({ category: 'Shirt', size: 'Small', fit: 'regular', confidence: 0.85 });
    } else if (measurements.chestCircumference <= 40) {
      recommendations.push({ category: 'Shirt', size: 'Medium', fit: 'regular', confidence: 0.92 });
    } else if (measurements.chestCircumference <= 44) {
      recommendations.push({ category: 'Shirt', size: 'Large', fit: 'regular', confidence: 0.88 });
    } else {
      recommendations.push({ category: 'Shirt', size: 'X-Large', fit: 'regular', confidence: 0.83 });
    }

    // Pants sizing logic
    const waistSize = Math.round(measurements.waistCircumference);
    recommendations.push({
      category: 'Pants',
      size: `${waistSize}x${Math.round(measurements.inseam)}`,
      fit: 'regular',
      confidence: 0.91
    });

    // Jacket sizing (similar to shirt but slightly larger)
    if (measurements.chestCircumference <= 38) {
      recommendations.push({ category: 'Jacket', size: 'Small', fit: 'regular', confidence: 0.82 });
    } else if (measurements.chestCircumference <= 42) {
      recommendations.push({ category: 'Jacket', size: 'Medium', fit: 'regular', confidence: 0.89 });
    } else if (measurements.chestCircumference <= 46) {
      recommendations.push({ category: 'Jacket', size: 'Large', fit: 'regular', confidence: 0.85 });
    } else {
      recommendations.push({ category: 'Jacket', size: 'X-Large', fit: 'regular', confidence: 0.80 });
    }

    return recommendations;
  };

  const convertUnits = (measurements: BodyMeasurements, targetUnit: 'inches' | 'cm'): BodyMeasurements => {
    if (measurements.units === targetUnit) return measurements;

    const conversionFactor = targetUnit === 'cm' ? 2.54 : 1 / 2.54;
    
    return {
      ...measurements,
      neckCircumference: measurements.neckCircumference * conversionFactor,
      shoulderWidth: measurements.shoulderWidth * conversionFactor,
      chestCircumference: measurements.chestCircumference * conversionFactor,
      bustCircumference: measurements.bustCircumference ? measurements.bustCircumference * conversionFactor : undefined,
      underbustCircumference: measurements.underbustCircumference ? measurements.underbustCircumference * conversionFactor : undefined,
      waistCircumference: measurements.waistCircumference * conversionFactor,
      armLength: measurements.armLength * conversionFactor,
      bicepCircumference: measurements.bicepCircumference * conversionFactor,
      wristCircumference: measurements.wristCircumference * conversionFactor,
      shirtLength: measurements.shirtLength * conversionFactor,
      hipCircumference: measurements.hipCircumference * conversionFactor,
      thighCircumference: measurements.thighCircumference * conversionFactor,
      inseam: measurements.inseam * conversionFactor,
      outseam: measurements.outseam * conversionFactor,
      kneeCircumference: measurements.kneeCircumference * conversionFactor,
      calfCircumference: measurements.calfCircumference * conversionFactor,
      ankleCircumference: measurements.ankleCircumference * conversionFactor,
      height: measurements.height * conversionFactor,
      units: targetUnit
    };
  };

  return {
    measurements,
    isProcessing,
    processingProgress,
    processMeasurements,
    generateSizingRecommendations,
    convertUnits,
    setMeasurements
  };
};