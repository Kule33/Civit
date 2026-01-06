import React from 'react';
import { Check } from 'lucide-react';


export function getStepStatus(
  stepId: number,
  currentStepId: number
): 'completed' | 'current' | 'pending' {
  if (stepId < currentStepId) return 'completed';
  if (stepId === currentStepId) return 'current';
  return 'pending';
}
interface Step {
  id: number;
  label: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStepId: number;
}


interface ProgressBarProps {
  steps: Step[];
}
export const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  currentStepId,
}) => {
  const completedCount = steps.filter(
    step => step.id < currentStepId
  ).length;

  const progressPercent =
    steps.length > 1
      ? (completedCount / (steps.length - 1)) * 100
      : 0;

  return (
    <div className="w-full sm:px-8 py-8 bg-red-500">
      <div className="relative">
        {/* Line */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative z-10 flex justify-between">
          {steps.map(step => {
            const status = getStepStatus(step.id, currentStepId);

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'current'
                      ? 'bg-white border-4 border-green-500'
                      : 'bg-white border-2 border-gray-300'
                    }`}
                >
                  {status === 'completed' && <Check size={14} />}
                  {status === 'current' && (
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>

                <span
                  className={`mt-3 text-xs sm:text-sm ${status === 'pending'
                    ? 'text-gray-400'
                    : 'text-gray-900'
                    }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

