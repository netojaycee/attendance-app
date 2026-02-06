"use client"
export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-[#833CF6] border-r-[#833CF6] rounded-full animate-spin"></div>
          
          {/* Middle ring (counter-rotating) */}
          <div className="absolute inset-2 border-3 border-transparent border-b-[#10B981] rounded-full animate-spin-reverse"></div>
          
          {/* Center dot */}
          <div className="absolute inset-4 bg-linear-to-br from-[#833CF6] to-[#10B981] rounded-full"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-sm font-medium text-primary animate-pulse">
          Loading...
        </p>
      </div>
      
      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        :global(.animate-spin-reverse) {
          animation: spin-reverse 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
