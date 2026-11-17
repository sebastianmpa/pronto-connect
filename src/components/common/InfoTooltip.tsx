import type { ReactNode } from "react";
import Tooltip from "../ui/tooltip/Tooltip";

interface InfoTooltipProps {
  label: string;
  content: ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
}

export default function InfoTooltip({ label, content, placement = "top" }: InfoTooltipProps) {
  return (
    <Tooltip
      content={<span className="block max-w-xs whitespace-normal leading-5">{content}</span>}
      placement={placement}
      variant="light"
    >
      <button
        type="button"
        aria-label={"Información: " + label}
        className="ml-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold opacity-65 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        i
      </button>
    </Tooltip>
  );
}
