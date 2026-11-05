import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>((props, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} className="pr-10" {...props} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs font-medium text-destructive">{msg}</p> : null;
}
