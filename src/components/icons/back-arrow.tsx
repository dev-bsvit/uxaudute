import React from 'react';

interface BackArrowProps {
  onClick?: () => void;
  className?: string;
}

export const BackArrow: React.FC<BackArrowProps> = ({
  onClick,
  className = ""
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-[50px] h-[50px] rounded-full bg-[#EEF2FA] flex items-center justify-center cursor-pointer hover:bg-[#E0E7F7] transition-colors ${className}`}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 12H5M5 12L12 19M5 12L12 5"
          stroke="#222222"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
