import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckoutStep {
  key: string;
  label: string;
}

interface CheckoutStepperProps {
  steps: CheckoutStep[];
  currentIndex: number;
}

export function CheckoutStepper({ steps, currentIndex }: CheckoutStepperProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isActive && !isCompleted && "border-primary text-primary",
                !isActive && !isCompleted && "border-border text-muted-foreground",
              )}
            >
              {isCompleted ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
            <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
