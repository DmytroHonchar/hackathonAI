import { Check } from 'lucide-react';

type BookingStatus = 'pending' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled';

const STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

interface BookingStatusStepperProps {
  status: BookingStatus;
}

export default function BookingStatusStepper({ status }: BookingStatusStepperProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="chip bg-coral-tint text-coral px-4 py-2 text-sm">Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start gap-0">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const upcoming = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? 'bg-agave text-white'
                    : active
                    ? 'bg-clay text-white ring-4 ring-clay/20'
                    : 'bg-sand text-ink-faint'
                }`}
              >
                {done ? <Check size={15} /> : index + 1}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${active ? 'text-clay-dark font-semibold' : upcoming ? 'text-ink-faint' : 'text-ink-soft'}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full ${done ? 'bg-agave' : 'bg-line'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
