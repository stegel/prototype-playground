"use client";

export default function MyPrototype() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center">
          <h2 className="card-title">My Prototype</h2>
          <p className="text-base-content/70">
            Start building your prototype here. Use DaisyUI components and
            Tailwind utilities, or create local components in a ./components
            folder.
          </p>
          <div className="card-actions">
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </div>
  );
}
