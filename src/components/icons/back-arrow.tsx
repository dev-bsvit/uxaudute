import React from 'react';

interface BackArrowProps {
  onClick?: () => void;
  className?: string;
}

export const BackArrow: React.FC<BackArrowProps> = ({ 
  onClick,
  className = "cursor-pointer hover:opacity-80 transition-opacity" 
}) => {
  return (
    <svg 
      width={50} 
      height={50} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <rect 
        x="32" 
        y="32" 
        width="32" 
        height="32" 
        rx="16" 
        transform="rotate(-180 32 32)" 
        fill="#F5F5F5"
      />
      <path 
        d="M10.4507 16.8555L10.4448 16.8496C10.2231 16.6218 10.1001 16.3167 10.1001 16C10.1001 15.6833 10.2231 15.3782 10.4448 15.1504L10.4507 15.1445L15.1255 10.4365L16.2612 11.5635L12.6499 15.2002L21.8999 15.2002L21.8999 16.7998L12.6499 16.7998L16.2612 20.4365L15.1255 21.5635L10.4507 16.8555Z" 
        fill="#222222"
      />
    </svg>
  );
};
