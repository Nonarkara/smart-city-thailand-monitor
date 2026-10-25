export type Quote = {
  rent?: number;
  extras?: number;
  commute?: number;
  access?: "walk" | "car" | "unknown";
  note?: string;
  commuteAt?: string;
  commuteFor?: string;
  commuteTravel?: string;
  lat?: number;
  lng?: number;
};
export type Preferences = {
  budget: number;
  travel: "rail" | "car" | "either";
  destination: string;
  departure?: string;
  maxCommute: number;
  interests: string[];
};
export type Place = {
  id: string;
  name: string;
  thai: string;
  lat: number;
  lng: number;
  station: string;
  line: string;
  character: string;
  tradeoff: string;
  visit: string;
  interests: string[];
  discover: { name: string; url: string }[];
  rentUrl: string;
  source: string;
  checkedAt: string;
};
export function amount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : undefined;
}
export function assess(p: Preferences, q: Quote = {}) {
  const validRent =
    typeof q.rent === "number" && Number.isFinite(q.rent) && q.rent > 0 && q.rent <= 1e12;
  const validExtras = q.extras === undefined || (typeof q.extras === "number" && Number.isFinite(q.extras) && q.extras >= 0 && q.extras <= 1e12);
  const validCommute = typeof q.commute === "number" && Number.isFinite(q.commute) && q.commute >= 0 && q.commute <= 1440;
  const validBudget = Number.isFinite(p.budget) && p.budget > 0 && p.budget <= 1e12;
  const validLimit = Number.isFinite(p.maxCommute) && p.maxCommute > 0 && p.maxCommute <= 1440;
  const total = validRent && validExtras ? q.rent! + (q.extras ?? 0) : null;
  const journeyCurrent =
    q.commuteFor === p.destination.trim() &&
    q.commuteTravel === p.travel &&
    q.commuteAt === p.departure;
  const reasons: string[] = [];
  const missing: string[] = [];
  if (!validBudget) missing.push("Enter a valid positive monthly ceiling.");
  if (p.destination && !validLimit) missing.push("Enter a valid positive journey limit.");
  if (!validExtras) missing.push("Re-enter valid transport, utilities and monthly extras.");
  if (total === null)
    missing.push("Add an actual rent quote to check your budget.");
  else if (validBudget && total > p.budget)
    reasons.push(
      `฿${Math.round(total - p.budget).toLocaleString()} over your monthly ceiling.`,
    );
  if (q.rent !== undefined && q.extras === undefined)
    missing.push(
      "Transport, utilities and other monthly extras are not included.",
    );
  if (p.travel === "rail" && q.access === "car")
    reasons.push(
      "You want rail-first living; this home needs a car for station access.",
    );
  if (p.travel === "rail" && (!q.access || q.access === "unknown"))
    missing.push(
      "Check the actual entrance-to-station walk, crossings and access gates.",
    );
  if (p.destination && (!journeyCurrent || !validCommute))
    missing.push("Test the door-to-door journey at your usual travel time.");
  if (
    p.destination &&
    journeyCurrent &&
    validCommute && validLimit &&
    q.commute! > p.maxCommute
  )
    reasons.push(`Journey exceeds your ${p.maxCommute}-minute limit.`);
  return {
    total,
    reasons,
    missing,
    status: reasons.length
      ? "Does not meet your limits"
      : missing.length
        ? "Needs checking"
        : "Meets your entered limits",
  };
}
export function interestMatches(place: Place, interests: string[]) {
  return interests.filter((i) => place.interests.includes(i));
}
export function readShared(search: string, ids: string[]) {
  const q = new URLSearchParams(search);
  return [...new Set((q.get("compare") ?? "").split(","))]
    .filter((id) => ids.includes(id))
    .slice(0, 3);
}
