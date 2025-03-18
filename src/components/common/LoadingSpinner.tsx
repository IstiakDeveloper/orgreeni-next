interface LoadingSpinnerProps {
    size?: "sm" | "default" | "lg";
    className?: string;
  }
  
  const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "default",
    className = "",
  }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
    };
  
    return (
      <div
        className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  };
  
  export default LoadingSpinner;