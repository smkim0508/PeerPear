export function PearAlert({ type, message }: { type: "error" | "success" | "warning"; message: string }) {
  const colors =
    type === "error"
      ? "bg-red-100 text-red-800 border-red-400"
      : type === "warning"
        ? "bg-yellow-100 text-yellow-800 border-yellow-400"
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
