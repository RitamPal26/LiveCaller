"use client";

interface UserAvatarProps {
  imageUrl?: string;
  name?: string;
  isOnline?: boolean;
  size?: "sm" | "md";
}

export function UserAvatar({
  imageUrl,
  name,
  isOnline,
  size = "md",
}: UserAvatarProps) {
  const sizeClasses = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const indicatorSize =
    size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3 border-2 border-slate-900";

  return (
    <div className="relative shrink-0">
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={name || "User"}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-slate-700 flex items-center justify-center text-white font-medium`}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
      {isOnline && (
        <div
          className={`absolute bottom-0 right-0 rounded-full bg-green-500 ${indicatorSize}`}
        />
      )}
    </div>
  );
}
