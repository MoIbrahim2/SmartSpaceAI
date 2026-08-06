import { useState, useRef, useCallback } from "react";
import Icon from "./Icon";

const BeforeAfterSlider = ({ beforeImage, afterImage, title = "Room Transformation" }) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPos(percentage);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  // If no before image exists, fallback to standard single image display
  if (!beforeImage) {
    return (
      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden neomorph-inset bg-black/5">
        <img
          src={afterImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/20">
          <Icon name="auto_awesome" size={16} className="text-amber-400" />
          <span>SmartSpace AI Render</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
      className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden neomorph-inset bg-black/10 select-none cursor-ew-resize group"
    >
      {/* After Image (AI Rendered) - Base Layer */}
      <img
        src={afterImage}
        alt="AI Rendered Design"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Badge: AI Render */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-primary/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
        <Icon name="auto_awesome" size={15} className="text-amber-300" />
        <span>AI Rendered Design</span>
      </div>

      {/* Before Image (Original Room) - Clipped Overlay Layer */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeImage}
          alt="Original Room Photo"
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%" }}
        />

        {/* Badge: Original Room */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-none whitespace-nowrap">
          <Icon name="photo_camera" size={15} className="text-sky-300" />
          <span>Original Room</span>
        </div>
      </div>

      {/* Slider Line Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Center Drag Handle Icon */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-primary font-bold shadow-2xl flex items-center justify-center border-2 border-primary cursor-ew-resize hover:scale-110 transition-transform">
          <div className="flex items-center gap-0.5">
            <Icon name="chevron_left" size={16} />
            <Icon name="chevron_right" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
