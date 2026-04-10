

interface FormHeaderProps {
  logoUrl?: string;
}

export default function FormHeader({
  logoUrl,
}: FormHeaderProps) {

  return (
    <div className={`w-full pb-0 flex flex-col items-center text-center`}>
      {logoUrl && (
        <div className="mb-0 flex justify-center w-full">
          <img
            src={logoUrl}
            alt="Form logo"
            className="max-w-full h-12 md:h-24 object-contain filter drop-shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
