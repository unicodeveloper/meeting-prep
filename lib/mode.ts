/**
 * App Mode Detection
 *
 * Two modes:
 * - 'self-hosted' (default): Uses VALYU_API_KEY directly, no auth required
 * - 'valyu': Uses OAuth proxy, user signs in with Valyu
 */

export function isSelfHostedMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_MODE !== "valyu";
}
