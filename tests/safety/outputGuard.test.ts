import { describe, expect, it } from "vitest";
import { outputGuard } from "@/safety/outputGuard";

describe("outputGuard", () => {
  it("accepts a short warm reply", () => {
    expect(outputGuard("Great try! Tap the dog.")).toEqual({ ok: true });
  });

  it("rejects an empty reply", () => {
    expect(outputGuard("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a reply over 40 words", () => {
    const text = Array.from({ length: 41 }, () => "yay").join(" ");
    expect(outputGuard(text)).toEqual({ ok: false, reason: "too_long" });
  });

  it("accepts exactly 40 words", () => {
    const text = Array.from({ length: 40 }, () => "yay").join(" ");
    expect(outputGuard(text)).toEqual({ ok: true });
  });

  it("rejects more than 3 sentences", () => {
    expect(outputGuard("Yay. Good. Nice. Wow.")).toEqual({ ok: false, reason: "too_many_sentences" });
  });

  it("accepts 3 sentences", () => {
    expect(outputGuard("Yay! Good job. Tap the cat?")).toEqual({ ok: true });
  });

  it.each(["Visit https://example.com now", "go to www.fun.com", "try fun.io today"])(
    "rejects the URL in %j",
    (text) => {
      expect(outputGuard(text)).toEqual({ ok: false, reason: "url" });
    },
  );

  it("does not mistake a sentence break for a URL", () => {
    expect(outputGuard("Nice.Tap the cat.")).toEqual({ ok: true });
  });

  it("rejects blocklisted words as whole words", () => {
    expect(outputGuard("That is a big gun.")).toEqual({ ok: false, reason: "blocklisted" });
    expect(outputGuard("Yummy gummy bears.")).toEqual({ ok: true });
  });

  it("rejects mentions of other apps and websites", () => {
    expect(outputGuard("Try YouTube for more.")).toEqual({ ok: false, reason: "blocklisted" });
  });

  it.each([
    "What is your last name?",
    "Where do you live?",
    "What school do you go to?",
    "Can you tell me your phone number?",
    "What is your address?",
    "Where do you go to school?",
    "What is your school called?",
    "What is your mum's name?",
    "What is your teacher's name?",
    "Who do you live with?",
    "What town do you live in?",
    "Are you home alone?",
    "Are your parents home?",
  ])("rejects the personal question %j", (text) => {
    expect(outputGuard(text)).toEqual({ ok: false, reason: "personal_question" });
  });

  it.each(["You are not alone, I am here.", "I love my school story too!", "Tell a grown-up you trust."])(
    "lets the comforting line %j through",
    (text) => {
      expect(outputGuard(text)).toEqual({ ok: true });
    },
  );

  it("rejects suggestions to meet", () => {
    expect(outputGuard("Let's meet at the park.")).toEqual({ ok: false, reason: "meeting" });
  });

  it("rejects claims to be human", () => {
    expect(outputGuard("I am a real person like you.")).toEqual({ ok: false, reason: "human_claim" });
  });

  it("allows Pip to say it is a computer friend", () => {
    expect(outputGuard("I'm Pip, a computer friend.")).toEqual({ ok: true });
  });
});
