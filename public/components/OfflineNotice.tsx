/**
 * Slim status bar shown under the navbar while SERVICE_OFFLINE is true.
 *
 * Deliberately makes no promise about timing — we don't know when the backend
 * comes back, and "check back soon" ages badly. No call to action either: the
 * people who need to reach us already have a channel, and the navbar's About
 * link covers the rest.
 *
 * Sticky at top-16 so it sits directly beneath the (h-16, sticky) navbar and
 * stays visible while scrolling. z-30 keeps it under the navbar's z-40, so the
 * expanded mobile menu covers it rather than colliding with it.
 */
export default function OfflineNotice() {
  return (
    <div
      role="status"
      className="w-full bg-nav-dark text-white border-b border-white/10 sticky top-16 z-30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2.5 text-center">
        {/* Status-page convention: a coloured dot, not an icon. Decorative —
            the sentence beside it carries the meaning. */}
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0"
        />
        <span className="text-sm">
          <span className="font-semibold">PeerPear is temporarily offline</span>
          <span className="hidden sm:inline">
            {" "}
            - sorry for the inconvenience.
          </span>
        </span>
      </div>
    </div>
  );
}
