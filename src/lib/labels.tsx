import { Badge } from "@/components/ui/badge";

const STATUS_CLASS: Record<string, string> = {
  WAITING: "bg-slate-100 text-slate-700 border-slate-200",
  CALLED: "bg-blue-100 text-blue-700 border-blue-200",
  SERVING: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  SKIPPED: "bg-amber-100 text-amber-800 border-amber-200",
  DROPOUT: "bg-rose-100 text-rose-700 border-rose-200",
};

const PRIORITY_CLASS: Record<string, string> = {
  NONE: "bg-slate-50 text-slate-500 border-slate-200",
  PWD: "bg-amber-100 text-amber-800 border-amber-200",
  SENIOR: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PREGNANT: "bg-pink-100 text-pink-800 border-pink-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  NONE: "Regular",
  PWD: "PWD",
  SENIOR: "Senior",
  PREGNANT: "Pregnant",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${STATUS_CLASS[status] ?? ""} font-medium`}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priorityType }: { priorityType: string }) {
  if (priorityType === "NONE") return null;
  return (
    <Badge variant="outline" className={`${PRIORITY_CLASS[priorityType] ?? ""} font-medium`}>
      {PRIORITY_LABEL[priorityType] ?? priorityType}
    </Badge>
  );
}
