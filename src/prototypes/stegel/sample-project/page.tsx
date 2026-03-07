"use client";

import { Card } from "@/components/ui";

export default function SampleProject() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-secondary p-8">
      <Card className="max-w-md w-full p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Sample project
        </h2>
        <p className="text-text-secondary text-sm">
          A project that demonstrates I can create projects
        </p>
      </Card>
    </div>
  );
}
