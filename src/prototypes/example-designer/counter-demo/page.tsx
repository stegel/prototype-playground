"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

export default function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-secondary p-8">
      <Card className="max-w-sm w-full p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Counter
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          A simple interactive demo using shared components.
        </p>
        <div className="text-6xl font-bold text-accent mb-8 tabular-nums">
          {count}
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => setCount((c) => c - 1)}
          >
            - Decrease
          </Button>
          <Button onClick={() => setCount((c) => c + 1)}>
            + Increase
          </Button>
        </div>
        <button
          onClick={() => setCount(0)}
          className="mt-4 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Reset
        </button>
      </Card>
    </div>
  );
}
