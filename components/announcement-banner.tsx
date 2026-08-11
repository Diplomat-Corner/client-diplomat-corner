export function AnnouncementBanner() {
  return (
    <div className="bg-gradient-to-r from-white/90 to-white text-primary py-2 text-center italic font-medium relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />
      <div className="relative z-10">The #1 Diplomatic Portal in Ethiopia!</div>
    </div>
  );
}
