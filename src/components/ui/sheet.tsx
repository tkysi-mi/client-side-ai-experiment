import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export function SheetContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <Dialog.Content className={cn("fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] border-r border-border bg-white p-0 shadow-xl focus:outline-none", className)}>
        <Dialog.Title className="sr-only">ナビゲーション</Dialog.Title>
        <Dialog.Description className="sr-only">実験ページを選択します</Dialog.Description>
        {children}
        <Dialog.Close aria-label="メニューを閉じる" className="absolute right-3 top-3 grid size-10 place-items-center rounded-md text-muted hover:bg-black/5 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/40">
          <X className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
