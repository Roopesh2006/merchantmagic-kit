import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopBannersProps {
  banners: string[];
}

export function ShopBanners({ banners }: ShopBannersProps) {
  const activeBanners = banners.filter(Boolean);

  if (activeBanners.length === 0) return null;

  // If there's only 1 banner, render it statically
  if (activeBanners.length === 1) {
    return (
      <div className="w-full h-40 md:h-48 relative overflow-hidden rounded-xl bg-neutral-100 mb-6">
        <img
          src={activeBanners[0]}
          alt="Shop Banner"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Pure React Slider Loop for 2+ banners (Avoids Shadcn Carousel type bugs)
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
    }, 5000); // 5-second slide interval
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="w-full h-40 md:h-48 relative overflow-hidden rounded-xl bg-neutral-100 mb-6 group">
      {/* Slides */}
      <div className="w-full h-full relative">
        {activeBanners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={banner}
              alt={`Shop Banner ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4 text-neutral-800" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4 text-neutral-800" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-y-0 -translate-x-1/2 z-20 flex space-x-1.5">
        {activeBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
