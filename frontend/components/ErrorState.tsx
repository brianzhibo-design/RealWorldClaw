export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-500">
      <span className="text-4xl mb-4">⚠️</span>
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p className="text-sm">{message || 'Unable to connect to API. Please try again later.'}</p>
    </div>
  );
}
