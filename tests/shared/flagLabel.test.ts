import { describe, expect, it } from "vitest";
import { flagLabel } from "@/app/(grown-up)/parent/_components/display";

describe("flagLabel", () => {
  it("names each removed detail in plain English", () => {
    expect(flagLabel("redacted:phone")).toBe("Phone number removed");
    expect(flagLabel("redacted:email")).toBe("Email removed");
    expect(flagLabel("redacted:address")).toBe("Address removed");
    expect(flagLabel("redacted:school")).toBe("School name removed");
    expect(flagLabel("redacted:surname")).toBe("Last name removed");
  });

  it("explains the redirect reasons without codes", () => {
    expect(flagLabel("disclosure")).toBe("Something worrying was shared");
    expect(flagLabel("unsafe_topic")).toBe("An unsafe topic came up");
  });

  it("makes an unknown code readable instead of showing it raw", () => {
    expect(flagLabel("redacted:new_thing")).toBe("redacted new thing");
  });
});
