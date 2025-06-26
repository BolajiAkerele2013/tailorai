import React from 'react';
import { Brain, Ruler, Eye, CheckCircle } from 'lucide-react';

interface ProcessingScreenProps {
  progress: number;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ progress }) => {
  const steps = [
    { icon: Eye, label: 'Analyzing pose detection', threshold: 20 },
    { icon: Brain, label: 'Processing AI landmarks', threshold: 40 },
    { icon: Ruler, label: 'Calculating measurements', threshold: 70 },
    { icon: CheckCircle, label: 'Validating results', threshold: 100 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4 animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing Your Measurements</h2>
            <p className="text-blue-200">Our AI is analyzing your body scan...</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-blue-200 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = progress >= step.threshold - 20 && progress < step.threshold;
              const isCompleted = progress >= step.threshold;
              const Icon = step.icon;

              return (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-orange-500/20 border border-orange-500/50' :
                    isCompleted ? 'bg-green-500/20 border border-green-500/50' :
                    'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    isActive ? 'bg-orange-500 animate-pulse' :
                    isCompleted ? 'bg-green-500' :
                    'bg-white/20'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isActive || isCompleted ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <span className={`text-sm ${
                    isActive ? 'text-orange-300 font-medium' :
                    isCompleted ? 'text-green-300' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-blue-300">
              This may take 30-60 seconds depending on image quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};