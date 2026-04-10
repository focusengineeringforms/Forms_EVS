import React from "react";

interface FormHeaderProps {
  title: string;
  description: string;
  logoUrl?: string;
  imageUrl?: string;
}

export default function FormHeader({
  logoUrl,
  imageUrl,
}: FormHeaderProps) {
  return (
    <div className="w-full pb-1 flex flex-col items-center text-center">
      {logoUrl && (
        <div className="mb-1 flex justify-center w-full">
          <img
            src={logoUrl}
            alt="Form logo"
            className="max-w-full max-h-16 object-contain"
          />
        </div>
      )}
      
      {imageUrl && !logoUrl && (
        <div className="mt-1 flex justify-start w-full">
          <img
            src={imageUrl}
            alt="Form header"
            className="max-w-full max-h-32 object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
