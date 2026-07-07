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
        <span className="bg-red-900/40 text-red-400 px-4 py-2 rounded-full text-sm font-medium">Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const upcoming = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? 'bg-amber-400 text-zinc-950'
                    : active
                    ? 'bg-amber-400 text-zinc-950 ring-4 ring-amber-400/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {done ? <Check size={14} /> : index + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-amber-400 font-semibold' : upcoming ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-amber-400' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
