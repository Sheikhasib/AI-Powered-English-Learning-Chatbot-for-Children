import { makeItems, withGroups, withSentences } from "./helpers";
import type { Item, Skill } from "./types";

function yesNo(id: string, word: string, picture: string, sentence: string, answer: "yes" | "no"): Item {
  return { id: `yes-no.${id}`, word, picture, sentence, answer };
}

/** Level 3: tiny sentences. Each item's sentence has a blank for the target word; the article lives in the sentence ("a" or "an"). */
export const level3Skills: Skill[] = [
  {
    id: "l3.i-like",
    level: 3,
    title: "Sentence: I like ...",
    unit: "sentences",
    order: 1,
    items: withSentences(
      makeItems("i-like", [
        ["apple", "🍎"],
        ["cat", "🐱"],
        ["ball", "⚽"],
        ["cake", "🍰"],
        ["dog", "🐶"],
        ["flower", "🌻"],
      ]),
      Array.from({ length: 6 }, () => "I like ___."),
    ),
    activityKinds: ["finish-sentence", "say-it"],
  },
  {
    id: "l3.this-is",
    level: 3,
    title: "Sentence: This is a ...",
    unit: "sentences",
    order: 2,
    items: withSentences(
      makeItems("this-is", [
        ["ball", "⚽"],
        ["cup", "🥤"],
        ["hat", "🧢"],
        ["book", "📖"],
        ["egg", "🥚"],
        ["umbrella", "☂️"],
      ]),
      [
        "This is a ___.",
        "This is a ___.",
        "This is a ___.",
        "This is a ___.",
        "This is an ___.",
        "This is an ___.",
      ],
    ),
    activityKinds: ["finish-sentence", "say-it"],
  },
  {
    id: "l3.i-see",
    level: 3,
    title: "Sentence: I see a ...",
    unit: "sentences",
    order: 3,
    items: withSentences(
      makeItems("i-see", [
        ["bird", "🐦"],
        ["tree", "🌳"],
        ["car", "🚗"],
        ["moon", "🌙"],
        ["ant", "🐜"],
        ["apple", "🍎"],
      ]),
      [
        "I see a ___.",
        "I see a ___.",
        "I see a ___.",
        "I see a ___.",
        "I see an ___.",
        "I see an ___.",
      ],
    ),
    activityKinds: ["finish-sentence", "say-it"],
  },
  {
    id: "l3.i-feel",
    level: 3,
    title: "Sentence: I feel ... (feelings)",
    unit: "feelings",
    order: 4,
    items: withSentences(
      makeItems("i-feel", [
        ["happy", "😊"],
        ["sad", "😢"],
        ["tired", "😴"],
        ["excited", "🤩"],
        ["angry", "😠"],
        ["scared", "😨"],
      ]),
      Array.from({ length: 6 }, () => "I feel ___."),
    ),
    activityKinds: ["finish-sentence", "say-it"],
  },
  {
    id: "l3.can-i-have",
    level: 3,
    title: "Asking nicely: Can I have ..., please?",
    unit: "manners",
    order: 5,
    items: withSentences(
      makeItems("can-i-have", [
        ["water", "💧"],
        ["apple", "🍎"],
        ["milk", "🥛"],
        ["ball", "⚽"],
        ["book", "📖"],
        ["egg", "🥚"],
      ]),
      [
        "Can I have some ___, please?",
        "Can I have an ___, please?",
        "Can I have some ___, please?",
        "Can I have a ___, please?",
        "Can I have a ___, please?",
        "Can I have an ___, please?",
      ],
    ),
    activityKinds: ["finish-sentence", "say-it"],
  },
  {
    id: "l3.yes-no",
    level: 3,
    title: "Yes and no questions",
    unit: "questions",
    order: 6,
    items: [
      yesNo("sun", "sun", "☀️", "Is the sun hot?", "yes"),
      yesNo("ice", "ice", "🧊", "Is ice hot?", "no"),
      yesNo("bird", "bird", "🐦", "Can a bird fly?", "yes"),
      yesNo("fish", "fish", "🐟", "Can a fish fly?", "no"),
      yesNo("milk", "milk", "🥛", "Is milk a drink?", "yes"),
      yesNo("ball", "ball", "⚽", "Is a ball an animal?", "no"),
    ],
    activityKinds: ["picture-match"],
  },
  {
    id: "l3.stories",
    level: 3,
    title: "Tiny stories (put in order)",
    unit: "stories",
    order: 7,
    items: withGroups(
      withSentences(
        makeItems("stories", [
          ["seed", "🌰"],
          ["water", "💧"],
          ["flower", "🌻"],
          ["cloud", "☁️"],
          ["rain", "🌧️"],
          ["rainbow", "🌈"],
        ]),
        [
          "Put a seed in the soil.",
          "Water the seed.",
          "A flower grows!",
          "A cloud comes.",
          "It rains.",
          "A rainbow shows up!",
        ],
      ),
      ["seed", "seed", "seed", "rain", "rain", "rain"],
    ),
    activityKinds: ["build-story"],
  },
];
