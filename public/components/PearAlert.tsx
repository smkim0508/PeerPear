export function PearAlert ({ type, message }: { type: "error" | "success"; message: string }) {
  const colors =
    type === "error"
      ? "bg-red-100 text-red-800 border-red-400"
      : "bg-green-100 text-green-800 border-green-400";

  return (
    <div
      className={`border ${colors} px-4 py-3 rounded-lg text-sm font-medium mb-6 text-center`}
      role="alert"
    >
      {message}
    </div>
  );
}
