
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  // Use the raw URL for the full logo provided by the user
  const logoUrl = "https://raw.githubusercontent.com/logik101/microF/main/fulllogo_nobuffer.jpg";
  
  const heightClasses = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-32'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${heightClasses[size]} relative group`}>
        <img 
          src={logoUrl} 
          alt="MicroFormS" 
          className="h-full w-auto object-contain rounded-md transition-all duration-500 group-hover:scale-105 shadow-sm"
        />
      </div>
      {/* 
          Since it's a "Full Logo", it likely already contains text. 
          We only show additional HTML text for specific cases or small sizes 
          where the image text might be too small.
      */}
      {showText && size === 'sm' && (
        <span className={`ml-3 font-black tracking-tight text-[#111827] text-lg`}>
          Micro<span className="text-[#1a3a8a]">FormS</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
