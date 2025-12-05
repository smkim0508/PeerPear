export function PearAlert ({ type, message }: { type: "error" | "success"; message: string }) {
  const colors =
    type === "error"
      ? "bg-red-100 text-red-800 border-red-400"
      : "bg-green text-nav-dark border-green";

  return (
    <div
      className={`border ${colors} px-4 py-3 rounded-lg text-sm font-medium mb-6 text-center`}
      role="alert"
    >
      {message}
    </div>
  );
}
