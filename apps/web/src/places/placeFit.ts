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
  /** Bedrooms in this specific home. 0 is a studio. A fact about one building only. */
  bedrooms?: number;
  /** The building's pet policy. A fact about one building only. */
  petsAllowed?: "yes" | "no" | "unknown";
};
export type Preferences = {
  budget: number;
  travel: "rail" | "car" | "either";
  destination: string;
  departure?: string;
  maxCommute: number;
  interests: string[];
  /** Minimum bedrooms the household needs. Undefined means no such requirement. */
  bedroomsNeeded?: number;
  /** The household has pets, so the building must allow them. */
  petsNeeded?: boolean;
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
  // Household hard constraints. A requirement the household states must never be
  // passed by a premise that has not been checked: an unrecorded premise is
  // "needs checking", never "meets your limits".
  const needed = p.bedroomsNeeded;
  const statedBedrooms = needed !== undefined;
  const validNeeded =
    typeof needed === "number" &&
    Number.isFinite(needed) &&
    Number.isInteger(needed) &&
    needed >= 1 &&
    needed <= 20;
  if (statedBedrooms && !validNeeded) {
    missing.push("Enter a valid number of bedrooms you need.");
  } else if (validNeeded) {
    const has = q.bedrooms;
    const validHas =
      typeof has === "number" &&
      Number.isFinite(has) &&
      Number.isInteger(has) &&
      has >= 0 &&
      has <= 20;
    if (!validHas) {
      missing.push(
        `Record the bedrooms in this home; your household needs ${needed}.`,
      );
    } else if (has < needed) {
      reasons.push(
        `This home has ${has} bedroom${has === 1 ? "" : "s"}; your household needs ${needed}.`,
      );
    }
  }
  if (p.petsNeeded === true) {
    const policy = q.petsAllowed;
    if (policy === "no") reasons.push("This building does not allow pets.");
    else if (policy !== "yes")
      missing.push("Confirm whether pets are allowed in this building.");
  }
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

/**
 * The checks a site visit still has to settle for this premise. These are the
 * stated requirements the premise has not been checked against, so a visit is
 * aimed at what is actually unknown rather than at a generic checklist.
 */
export function visitChecklist(p: Preferences, q: Quote = {}): string[] {
  return [...new Set(assess(p, q).missing)];
}

/** Comparison cell text: what the premise has, against what the household needs. */
export function bedroomText(q: Quote, needed?: number): string {
  if (q.bedrooms === undefined)
    return needed ? `Not recorded — you need ${needed}` : "Not recorded";
  const have = `${q.bedrooms} bedroom${q.bedrooms === 1 ? "" : "s"}`;
  return needed && q.bedrooms < needed ? `${have} — you need ${needed}` : have;
}
export function petsText(q: Quote, needed?: boolean): string {
  const state =
    q.petsAllowed === "yes"
      ? "Allowed"
      : q.petsAllowed === "no"
        ? "Not allowed"
        : "Not confirmed";
  return needed && q.petsAllowed !== "yes"
    ? `${state} — you have pets`
    : state;
}
export function householdText(p: Preferences): string {
  const parts: string[] = [];
  if (p.bedroomsNeeded)
    parts.push(`${p.bedroomsNeeded} bedroom${p.bedroomsNeeded === 1 ? "" : "s"}`);
  if (p.petsNeeded) parts.push("pets must be allowed");
  return parts.length
    ? parts.join(" and ")
    : "no bedroom or pet requirement stated";
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
