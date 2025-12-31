
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const logoUrl = "https://raw.githubusercontent.com/logik101/microF/main/fulllogo_nobuffer.jpg";
  
  const heightClasses = {
    sm: 'h-6 sm:h-8',
    md: 'h-8 sm:h-10',
    lg: 'h-24 sm:h-32'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${heightClasses[size]} relative group`}>
        <img 
          src={logoUrl} 
          alt="MicroFormS" 
          className="h-full w-auto object-contain rounded-md transition-all duration-500 group-hover:scale-105"
        />
      </div>
      {showText && size === 'sm' && (
        <span className={`ml-2 sm:ml-3 font-black tracking-tight text-[#111827] text-base sm:text-lg`}>
          Micro<span className="text-[#1a3a8a]">FormS</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
