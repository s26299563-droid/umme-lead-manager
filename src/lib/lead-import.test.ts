import { describe, expect, it } from "vitest";

import { mapImportedLead } from "@/lib/lead-import";

describe("spreadsheet lead mapping", () => {
  it("maps common spreadsheet columns into a CRM lead", () => {
    expect(
      mapImportedLead(
        ["Full Name", "Company", "Email Address", "Stage", "Potential Value"],
        ["Asha Rao", "Northstar", "asha@example.com", "Qualified", "$1,250"],
      ),
    ).toMatchObject({
      name: "Asha Rao",
      company: "Northstar",
      email: "asha@example.com",
      status: "Qualified",
      deal_value: 1250,
    });
  });

  it("skips rows without a lead name", () => {
    expect(mapImportedLead(["Company", "Email"], ["Northstar", "team@example.com"])).toBeNull();
  });
});