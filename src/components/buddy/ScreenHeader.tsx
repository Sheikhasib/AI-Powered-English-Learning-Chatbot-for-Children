import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  backHref: string;
  title: string;
};

/** Back is always a big, labeled icon button, with the screen's name beside it. */
export function ScreenHeader({ backHref, title }: Props) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href={backHref}
        className="flex h-16 items-center gap-2 rounded-full border-2 border-border bg-card px-6 text-label font-bold text-primary active:scale-[0.96] motion-reduce:active:scale-100"
      >
        <ArrowLeft aria-hidden className="size-7" />
        Back
      </Link>
      <h1 className="text-bubble font-bold">{title}</h1>
    </header>
  );
}
