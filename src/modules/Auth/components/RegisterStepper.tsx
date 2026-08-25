import React from 'react';
import { Check, User, MapPin, GraduationCap } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  totalSteps?: number;
}

const STEPS = [
  {
    id: 1,
    title: 'Personal Info',
    subtitle: 'Name, Phone & Email',
    icon: User,
  },
  {
    id: 2,
    title: 'Location & School',
    subtitle: 'State, District & Institute',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'Academic Profile',
    subtitle: 'Class, Language & Target',
    icon: GraduationCap,
  },
];

const RegisterStepper: React.FC<StepperProps> = ({ currentStep, totalSteps = 3 }) => {
  const progressPercent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full space-y-4 py-2">
      {/* Top Stepper Nodes */}
      <div className="relative flex items-center justify-between">
        {/* Progress Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 -z-0 h-1 -translate-y-1/2 bg-slate-200 rounded-full mx-6">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              {/* Step Circle Button */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/30'
                    : isActive
                      ? 'border-brand-600 bg-white text-brand-600 ring-4 ring-brand-100 shadow-md'
                      : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center hidden sm:block">
                <p
                  className={`text-xs font-bold transition-colors ${
                    isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-500">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Step Title Banner */}
      <div className="sm:hidden flex items-center justify-between rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700">
        <span className="text-brand-600 font-bold">
          Step {currentStep} of {totalSteps}:
        </span>
        <span className="text-slate-900">{STEPS[currentStep - 1].title}</span>
      </div>
    </div>
  );
};

export default RegisterStepper;
