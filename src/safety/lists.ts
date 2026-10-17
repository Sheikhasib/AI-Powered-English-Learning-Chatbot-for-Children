/** Words and phrases the safety guards match against. Curated by hand; keep entries lowercase. */

/** Highest word count of an LLM reply. */
export const MAX_REPLY_WORDS = 40;

/** Highest sentence count of an LLM reply. */
export const MAX_REPLY_SENTENCES = 3;

/** Topics Pip never discusses. Matched as whole words so "gummy" never trips "gun"-like entries. */
export const UNSAFE_WORDS: readonly string[] = [
  "kill", "kills", "killed", "killing", "murder", "die", "dies", "died", "dead", "death",
  "gun", "guns", "shoot", "shoots", "knife", "knives", "bomb", "bombs", "blood", "bleed",
  "weapon", "weapons", "stab", "suicide",
  "sex", "sexy", "naked", "nude", "porn",
  "drug", "drugs", "beer", "wine", "vodka", "cigarette", "cigarettes", "alcohol",
  "damn", "hell", "shit", "fuck", "crap", "bitch", "bastard",
];

/** Extra words Pip must not say: rude words, scary content, brands, and other apps or sites. */
export const OUTPUT_ONLY_BLOCKLIST: readonly string[] = [
  "stupid", "idiot", "hate",
  "scary", "ghost", "ghosts", "zombie", "zombies", "monster", "monsters", "demon", "devil",
  "god", "church", "pray", "religion",
  "youtube", "google", "tiktok", "instagram", "facebook", "snapchat", "roblox", "minecraft",
  "fortnite", "netflix", "disney", "lego", "mcdonalds", "website", "websites",
  "app", "apps", "download", "email", "online", "password",
];

/** Harm verbs with the spellings small children use ("hert", "tuched"). */
const HARM_VERBS =
  "(?:hurt|hert|hirt|hurts|herts|hurted|hurting|hit|hits|hited|hitted|hitting|kick|kicks|kicked|kicking|" +
  "slap|slaps|slapped|pinch|pinches|pinched|grab|grabs|grabbed|choke|chokes|choked|" +
  "touch|touches|touched|touching|tuch|tuches|tuched|tuching)";

/** Someone else doing it; "I hurt my knee" has no such subject, so it is not a disclosure. */
const OTHER_PERSON =
  "(?:he|she|they|someone|somebody|(?:my )?(?:dad|daddy|mom|mommy|mum|mummy|brother|sister|uncle|aunt|auntie|" +
  "stepdad|stepmom|babysitter|teacher|grandpa|grandma|neighbor|neighbour)|(?:a|the) (?:man|boy|lady|stranger|big kid))";

/** Only the body counts, so "he hit my ball" is not matched. */
const BODY_PART =
  "(?:arm|arms|leg|legs|head|face|back|tummy|belly|body|hand|hands|hair|ear|ears|neck|chest|bum|bottom|butt|private|privates)";

/** Normalised phrases that suggest a child may be hurt or in danger. */
export const DISCLOSURE_PATTERNS: readonly RegExp[] = [
  new RegExp(`\\b(?:${HARM_VERBS}|beat|beats|kill|kills|killed|stab|stabs|shoot|shoots)\\s+me\\b`),
  new RegExp(
    `\\b${OTHER_PERSON}\\s+(?:(?:always|often|sometimes|keeps|kept|really|so) )?${HARM_VERBS}\\s+my ${BODY_PART}\\b`,
  ),
  /\b(?:touch|touches|touched|touching|tuch|tuched)\s+my\s+private/,
  /\bi (?:(?:want|need|wnat) (?:to|2)|wanna|wana) (?:die|dy|be dead|kill myself|hurt myself|cut myself)\b/,
  /\bi wish i (?:was|were) (?:dead|never born)\b/,
  /\bi (?:do not|don t|dont) want to (?:be alive|live|be here)\b/,
  /\bkill myself\b/,
  /\b(?:going to|gonna|will) (?:hurt|cut|harm) myself\b/,
  /\bi (?:am|m) (?:not safe|in danger|being hurt)\b/,
  /\bi (?:am|m) (?:scared|afraid|frightened) (?:to go|of going|to be) (?:home|there|alone)\b/,
  /\bnot safe (?:at|in) (?:home|my house)\b/,
  /\bdon t tell (?:anyone|anybody|mom|mommy|dad|daddy|mum)\b/,
  /\bmade me (?:take off|do something)\b/,
];

/** Pip's fixed, gentle answer to a disclosure. Never written by the LLM. */
export const DISCLOSURE_SCRIPT =
  "I'm glad you told me. You are brave. Please tell a grown-up you trust right now.";

/** Pip's fixed answer to an unsafe topic. */
export const UNSAFE_TOPIC_SCRIPT = "That is not for us. Let's play a fun word game!";

/** Normalised questions that ask for personal details; Pip never asks these. */
export const PERSONAL_QUESTION_PATTERNS: readonly RegExp[] = [
  /\byour (?:last|full|real|family) ?name\b/,
  /\byour surname\b/,
  /\bwhere do you (?:live|stay|go to school)\b/,
  /\bwhat (?:is|s) your (?:address|phone|number|email|school|teacher|town|city)\b/,
  /\byour (?:phone|address|email|home|school|teacher)\b/,
  /\b(?:what|which) school\b/,
  /\bhow old are you\b/,
  /\bwhere (?:are you|is your (?:house|home|school))\b/,
  /\byour (?:mum|mom|mommy|mummy|mother|dad|daddy|father|brother|sister|teacher|grandma|grandpa|pet) s name\b/,
  /\bwho do you live with\b/,
  /\bwhat (?:town|city|street|country) (?:do you|are you)\b/,
  /\bare you (?:home )?alone\b/,
  /\bare your (?:parents|mum|mom|dad) (?:home|there|with you|out)\b/,
];

/** Normalised phrases that suggest meeting in person. */
export const MEETING_PATTERNS: readonly RegExp[] = [
  /\b(?:let s|lets|we can|we could|can we|come and|come to)\s+meet\b/,
  /\bmeet (?:me|up|you)\b/,
  /\bcome (?:to my|over)\b/,
];

/** Normalised phrases that claim Pip is a person. */
export const HUMAN_CLAIM_PATTERNS: readonly RegExp[] = [
  /\bi (?:am|m) (?:a )?(?:real )?(?:human|person|boy|girl|kid|child)\b/,
  /\breal person\b/,
];

/** Words that can follow a first name after "my name is" without being a surname. */
export const NAME_FOLLOWERS: readonly string[] = [
  "and", "but", "so", "i", "im", "because", "the", "a", "my", "to", "is", "too", "also", "then", "or",
];

/** Street words that turn "42 Oak Street" into an address. */
export const STREET_WORDS: readonly string[] = [
  "street", "st", "road", "rd", "avenue", "ave", "lane", "ln", "drive", "dr", "court", "ct",
  "way", "boulevard", "blvd", "close", "crescent", "place",
];

/** Words that make "<name> school" a named school. */
export const SCHOOL_WORDS: readonly string[] = [
  "school", "academy", "kindergarten", "nursery", "preschool", "daycare",
];

/** Words that never count as the name part of "<name> school". */
export const SCHOOL_NON_NAMES: readonly string[] = [
  "the", "a", "my", "our", "your", "to", "at", "in", "on", "new", "old", "big", "little",
  "after", "before", "no", "same", "this", "that", "every", "each",
];
