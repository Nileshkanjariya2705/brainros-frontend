import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Lock } from 'lucide-react';

export type StepStatus = 'completed' | 'current' | 'pending' | 'locked';

export interface WorkflowStep {
  id: string | number;
  stepNumber: number;
  title: string;
  subtitle?: string;
  status: StepStatus;
  to?: string;
  disabled?: boolean;
}

export interface WorkflowStepIndicatorProps {
  steps: WorkflowStep[];
  workflowTitle?: string;
  onStepClick?: (step: WorkflowStep) => void;
  className?: string;
}

export const WorkflowStepIndicator: React.FC<WorkflowStepIndicatorProps> = ({
  steps,
  workflowTitle,
  onStepClick,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs ${className}`}
      aria-label="Workflow Steps"
    >
      {workflowTitle && (
        <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span className="uppercase tracking-wider text-[11px] text-slate-400 font-bold">
            Workflow Progress
          </span>
          <span className="font-medium text-slate-600">{workflowTitle}</span>
        </div>
      )}

      {/* Steps List */}
      <ol className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isLocked = step.status === 'locked';
          const isClickable = Boolean(step.to && !step.disabled && !isLocked && !isCurrent);

          const StepContent = (
            <div
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all w-full ${
                isCurrent
                  ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-900 shadow-xs'
                  : isCompleted
                    ? 'bg-slate-50/80 border border-slate-200/70 text-slate-800 hover:bg-slate-100/80'
                    : isLocked
                      ? 'bg-slate-50/40 border border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              } ${isClickable ? 'cursor-pointer hover:border-slate-300' : ''}`}
            >
              {/* Step Icon / Badge */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                      : isLocked
                        ? 'bg-slate-200 text-slate-400'
                        : 'border border-slate-300 bg-white text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : isLocked ? (
                  <Lock className="h-3 w-3" />
                ) : isCurrent ? (
                  <span className="text-[10px] leading-none font-black">●</span>
                ) : (
                  <span className="text-[11px] leading-none">{step.stepNumber}</span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      isCurrent
                        ? 'text-indigo-950'
                        : isCompleted
                          ? 'text-slate-900'
                          : isLocked
                            ? 'text-slate-400'
                            : 'text-slate-700'
                    }`}
                  >
                    Step {step.stepNumber}: {step.title}
                  </span>
                  {isCompleted && (
                    <span className="hidden md:inline-flex rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                      Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="hidden md:inline-flex rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
                      Current
                    </span>
                  )}
                </div>
                {step.subtitle && (
                  <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>
          );

          return (
            <React.Fragment key={step.id || step.stepNumber}>
              <li className="flex-1 min-w-0">
                {isClickable && step.to ? (
                  <Link
                    to={step.to}
                    onClick={() => onStepClick?.(step)}
                    className="block w-full focus:outline-hidden"
                  >
                    {StepContent}
                  </Link>
                ) : (
                  <div
                    onClick={() => {
                      if (!isLocked && !step.disabled && onStepClick) {
                        onStepClick(step);
                      }
                    }}
                  >
                    {StepContent}
                  </div>
                )}
              </li>

              {/* Step Divider / Arrow on Desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden sm:flex items-center justify-center text-slate-300 px-0.5">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
};

export default WorkflowStepIndicator;
