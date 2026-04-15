import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</span>
        {hint ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p> : null}
      </div>
      {children}
    </label>
  );
}

const CONTROL_CLASS =
  "w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-[rgba(3,7,11,0.86)] px-4 py-3 text-[var(--text-primary)] outline-none transition duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[var(--text-muted)] focus:border-[rgba(67,229,255,0.45)] focus:bg-[rgba(3,7,11,0.96)] focus:ring-2 focus:ring-[rgba(67,229,255,0.14)]";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={[CONTROL_CLASS, props.className ?? ""].join(" ")} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={[CONTROL_CLASS, props.className ?? ""].join(" ")} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={[CONTROL_CLASS, props.className ?? ""].join(" ")} />;
}
