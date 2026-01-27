export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/50 backdrop-blur-[2px] animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center gap-4">
        {/* Minimalist Orbiting Loader */}
        <div className="relative h-12 w-12">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/5" />
            
            {/* Animated segment */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/30 animate-spin" />
            
            {/* Inner Glow center */}
            <div className="absolute inset-2 bg-primary/10 rounded-full blur-sm animate-pulse" />
        </div>
        
        <p className="text-[9px] font-black tracking-[0.6em] text-primary/40 uppercase ml-[0.6em]">
            Navigating
        </p>
      </div>
    </div>
  )
}
