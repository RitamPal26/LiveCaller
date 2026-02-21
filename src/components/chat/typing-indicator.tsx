export function TypingIndicator({
  activeTypists,
}: {
  activeTypists: string[];
}) {
  if (!activeTypists || activeTypists.length === 0) return null;

  return (
    <div className="px-4 py-2 flex items-center text-sm text-slate-400">
      <span className="italic mr-2">
        {activeTypists.join(", ")} {activeTypists.length === 1 ? "is" : "are"}{" "}
        typing
      </span>
      <div className="flex space-x-1 items-center mb-1">
        <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
