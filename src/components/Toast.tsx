import {
  CheckCircle2,
} from 'lucide-react';

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1F2421] text-white text-xs font-semibold shadow-lg flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-[#7BD389]" />
      <span>{message}</span>
    </div>
  );
}
