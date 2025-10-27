import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
  steps: {
    number: 1 | 2 | 3
    title: string
    description: string
  }[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.number < currentStep
                    ? 'bg-blue-600 border-blue-600'
                    : step.number === currentStep
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <span
                    className={`text-lg font-semibold ${
                      step.number === currentStep ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    step.number === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">{step.description}</p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 mb-8">
                <div
                  className={`h-full transition-colors ${
                    step.number < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
