import React from 'react';
import { Camera, Ruler, Shirt, User } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6">
              <Ruler className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              AI Tailor
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Get precise clothing measurements using your camera
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <Camera className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Camera Scan</h3>
              <p className="text-blue-200 text-sm">
                Use your device camera to capture body measurements with AI precision
              </p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <User className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Pose Guidance</h3>
              <p className="text-blue-200 text-sm">
                Follow step-by-step instructions for accurate measurement capture
              </p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <Shirt className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Size Recommendations</h3>
              <p className="text-blue-200 text-sm">
                Get tailored sizing recommendations for shirts, pants, and more
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onStart}
              className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Start Measurement Scan
            </button>
            
            <p className="text-sm text-blue-300 mt-4">
              Ensure good lighting and 6ft of space around you for best results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};