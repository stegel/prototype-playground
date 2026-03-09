"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function CounterWithResetButton() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <Card className="flex flex-col items-center gap-8 p-10 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-base-content">Counter</h1>

        <div
          className={cn(
            "text-7xl font-mono font-bold tabular-nums transition-colors",
            count > 0 && "text-primary",
            count < 0 && "text-red-500",
            count === 0 && "text-base-content"
          )}
        >
          {count}
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => setCount((c) => c - 1)}
          >
            −
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => setCount((c) => c + 1)}
          >
            +
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCount(0)}
          disabled={count === 0}
        >
          Reset
        </Button>
      </Card>
    </div>
  );
}
