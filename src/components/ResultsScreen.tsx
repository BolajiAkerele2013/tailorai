import React, { useState } from 'react';
import { Download, Share2, RotateCcw, Ruler, Shirt, User, Save, CheckCircle } from 'lucide-react';
import { BodyMeasurements, SizingRecommendation, CapturedPoseData } from '../types/measurements';

interface ResultsScreenProps {
  measurements: BodyMeasurements;
  recommendations: SizingRecommendation[];
  rawPoseData: CapturedPoseData[];
  onRestart: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  measurements, 
  recommendations, 
  rawPoseData,
  onRestart 
}) => {
  const [activeTab, setActiveTab] = useState<'measurements' | 'sizes'>('measurements');
  const [units, setUnits] = useState<'inches' | 'cm'>(measurements.units);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const formatMeasurement = (value: number) => {
    return `${value.toFixed(1)} ${units}`;
  };

  const upperBodyMeasurements = [
    { label: 'Neck Circumference', value: measurements.neckCircumference, key: 'neck' },
    { label: 'Shoulder Width', value: measurements.shoulderWidth, key: 'shoulder' },
    { label: 'Chest Circumference', value: measurements.chestCircumference, key: 'chest' },
    { label: 'Waist Circumference', value: measurements.waistCircumference, key: 'waist' },
    { label: 'Arm Length', value: measurements.armLength, key: 'arm' },
    { label: 'Bicep Circumference', value: measurements.bicepCircumference, key: 'bicep' },
    { label: 'Wrist Circumference', value: measurements.wristCircumference, key: 'wrist' },
    { label: 'Shirt Length', value: measurements.shirtLength, key: 'shirtLength' }
  ];

  const lowerBodyMeasurements = [
    { label: 'Hip Circumference', value: measurements.hipCircumference, key: 'hip' },
    { label: 'Thigh Circumference', value: measurements.thighCircumference, key: 'thigh' },
    { label: 'Inseam', value: measurements.inseam, key: 'inseam' },
    { label: 'Outseam', value: measurements.outseam, key: 'outseam' },
    { label: 'Knee Circumference', value: measurements.kneeCircumference, key: 'knee' },
    { label: 'Calf Circumference', value: measurements.calfCircumference, key: 'calf' },
    { label: 'Ankle Circumference', value: measurements.ankleCircumference, key: 'ankle' }
  ];

  const handleSaveMeasurements = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/.netlify/functions/save-measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurements,
          rawLandmarks: rawPoseData, // Now passing the actual pose data
          profileData: {
            name: 'Anonymous User', // In a real app, you'd get this from user input
            preferences: { units, fit: 'regular' }
          }
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const data = {
      measurements,
      recommendations,
      rawPoseData,
      timestamp: new Date().toISOString(),
      confidence: measurements.confidence
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `body-measurements-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `My body measurements from AI Tailor:\n\nChest: ${formatMeasurement(measurements.chestCircumference)}\nWaist: ${formatMeasurement(measurements.waistCircumference)}\nHeight: ${formatMeasurement(measurements.height)}\n\nRecommended shirt size: ${recommendations.find(r => r.category === 'Shirt')?.size || 'N/A'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Body Measurements',
          text
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-800 to-blue-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Measurements</h1>
            <p className="text-green-200">
              Confidence: {Math.round(measurements.confidence * 100)}% • {rawPoseData.length} poses captured
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSaveMeasurements}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                saveStatus === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saveStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={onRestart}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Scan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Tab Navigation */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('measurements')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'measurements'
                ? 'bg-white text-gray-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Ruler className="w-4 h-4 mr-2 inline" />
            Detailed Measurements
          </button>
          <button
            onClick={() => setActiveTab('sizes')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-colors ml-1 ${
              activeTab === 'sizes'
                ? 'bg-white text-gray-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Shirt className="w-4 h-4 mr-2 inline" />
            Size Recommendations
          </button>
        </div>

        {activeTab === 'measurements' && (
          <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Body Measurements</h2>
                <p className="text-gray-600">Captured on {measurements.timestamp.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-700">Units:</label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as 'inches' | 'cm')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="inches">Inches</option>
                  <option value="cm">Centimeters</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 gap-8">
              {/* Upper Body */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Upper Body
                </h3>
                <div className="space-y-3">
                  {upperBodyMeasurements.map((measurement) => (
                    <div key={measurement.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">{measurement.label}</span>
                      <span className="font-medium text-gray-900">
                        {formatMeasurement(measurement.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Body */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-green-600" />
                  Lower Body
                </h3>
                <div className="space-y-3">
                  {lowerBodyMeasurements.map((measurement) => (
                    <div key={measurement.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">{measurement.label}</span>
                      <span className="font-medium text-gray-900">
                        {formatMeasurement(measurement.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="p-6 bg-gray-50 rounded-b-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatMeasurement(measurements.height)}</div>
                  <div className="text-sm text-gray-600">Height</div>
                </div>
                {measurements.weight && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{measurements.weight} lbs</div>
                    <div className="text-sm text-gray-600">Weight</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(measurements.confidence * 100)}%</div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sizes' && (
          <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Size Recommendations</h2>
              <p className="text-gray-600">Based on your measurements and standard sizing charts</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <Shirt className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">{rec.category}</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{rec.size}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      {rec.fit.charAt(0).toUpperCase() + rec.fit.slice(1)} fit
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${rec.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(rec.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Sizes may vary between brands and manufacturers</li>
                  <li>• These recommendations are based on standard sizing charts</li>
                  <li>• Consider your personal fit preferences when ordering</li>
                  <li>• For tailoring, use the detailed measurements tab</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Save Status Message */}
        {saveStatus === 'error' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Failed to save measurements. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};