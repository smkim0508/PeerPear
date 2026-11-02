/**
 * Temporary "service offline" switch.
 *
 * The Heroku backend is paused, so every authenticated route would otherwise
 * hang on a dead API (see NEXT_PUBLIC_API_URL callers). While SERVICE_OFFLINE
 * is true the site serves only the landing page plus /about, with a notice
 * explaining that PeerPear is temporarily unavailable.
 *
 * To restore the site: set SERVICE_OFFLINE to false and redeploy. That's the
 * only step — next.config.ts reads this flag and drops its redirects when it
 * is false. Note that `next dev` caches next.config.ts and won't pick up a
 * change to this file until you restart the dev server; a production build
 * always re-evaluates it.
 *
 * Typed as `boolean` rather than letting TS infer the literal `true` so both
 * branches of every `if (SERVICE_OFFLINE)` still typecheck when it is flipped.
 */
export const SERVICE_OFFLINE: boolean = true;
