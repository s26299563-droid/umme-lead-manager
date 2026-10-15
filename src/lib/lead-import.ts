export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type ImportedLead = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  deal_value: number;
  next_follow_up: string | null;
  notes: string;
};

const FIELD_ALIASES: Record<keyof ImportedLead, string[]> = {
  name: ["name", "lead", "leadname", "contact", "contactname", "full name", "fullname"],
  company: ["company", "business", "organization", "organisation", "account"],
  email: ["email", "emailaddress", "mail"],
  phone: ["phone", "telephone", "mobile", "contactnumber", "phonenumber"],
  source: ["source", "leadsource", "channel", "origin"],
  status: ["status", "stage", "leadstatus", "pipeline"],
  deal_value: ["dealvalue", "value", "amount", "revenue", "potentialvalue"],
  next_follow_up: ["nextfollowup", "followup", "followupdate", "nextcontact", "reminder"],
  notes: ["notes", "note", "comments", "description"],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellText(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value ?? "").trim();
}

function normalizeStatus(value: string): LeadStatus {
  const normalized = value.trim().toLowerCase();
  const found = LEAD_STATUSES.find((status) => status.toLowerCase() === normalized);
  if (found) return found;
  if (["open", "uncontacted", "lead"].includes(normalized)) return "New";
  if (["in progress", "in-progress", "working"].includes(normalized)) return "Contacted";
  if (["closed won", "closed-won", "customer"].includes(normalized)) return "Won";
  if (["closed lost", "closed-lost", "disqualified"].includes(normalized)) return "Lost";
  return "New";
}

function normalizeValue(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeDate(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function mapImportedLead(headers: unknown[], cells: unknown[]): ImportedLead | null {
  const values: Partial<Record<keyof ImportedLead, string>> = {};
  for (const [index, header] of headers.entries()) {
    const normalizedHeader = normalizeHeader(header);
    const field = (Object.keys(FIELD_ALIASES) as (keyof ImportedLead)[]).find((key) =>
      FIELD_ALIASES[key].some((alias) => normalizeHeader(alias) === normalizedHeader),
    );
    if (field && values[field] === undefined) values[field] = cellText(cells[index]);
  }

  const name = values.name?.trim() ?? "";
  if (!name) return null;

  return {
    name,
    company: values.company ?? "",
    email: values.email ?? "",
    phone: values.phone ?? "",
    source: values.source || "Excel import",
    status: normalizeStatus(values.status ?? ""),
    deal_value: normalizeValue(values.deal_value ?? ""),
    next_follow_up: normalizeDate(values.next_follow_up ?? ""),
    notes: values.notes ?? "",
  };
}