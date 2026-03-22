"use client";

import * as React from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SensitiveInputProps extends React.ComponentProps<"input"> {
  onValueChange?: (value: string) => void;
}

export function SensitiveInput({
  className,
  value,
  onChange,
  onValueChange,
  ...props
}: SensitiveInputProps) {
  const [show, setShow] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const textToCopy = value?.toString() || "";
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <InputGroup className={cn("h-11", className)}>
        <InputGroupInput
          {...props}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
        />
        <InputGroupAddon align="inline-end" className="gap-1">
          {!show ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  size="icon-sm"
                  onClick={() => setShow(true)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Eye className="w-4 h-4" />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>显示内容</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    size="icon-sm"
                    onClick={handleCopy}
                    className={cn(
                      "transition-colors",
                      copied ? "text-green-500" : "text-blue-500 hover:text-blue-600"
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>{copied ? "已复制" : "复制到剪贴板"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    size="icon-sm"
                    onClick={() => setShow(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <EyeOff className="w-4 h-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>隐藏</TooltipContent>
              </Tooltip>
            </>
          )}
        </InputGroupAddon>
      </InputGroup>
    </TooltipProvider>
  );
}
