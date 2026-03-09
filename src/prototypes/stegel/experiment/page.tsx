"use client";

import { Button, Card } from "@/components/ui";

export default function MyPrototype() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <Card className="max-w-md w-full p-8 text-center">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          My Prototype
        </h2>
        <p className="text-base-content/60 mb-6">
          Start building your prototype here. Use shared components from
          @/components/ui or create local components in a ./components folder.
        </p>
        <Button>Get Started</Button>
      </Card>
    </div>
  );
}
