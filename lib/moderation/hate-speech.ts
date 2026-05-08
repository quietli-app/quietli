export type HateSpeechDecision = {
  allowed: boolean;
  reason?: string;
  message?: string;
  categories: string[];
};

const BLOCK_MESSAGE =
  "This blip can’t be posted because it appears to target a protected group or identity.";

const PROTECTED_GROUP_PATTERN =
  "(?:black|white|asian|latino|latina|hispanic|indigenous|native|jewish|muslim|christian|hindu|sikh|buddhist|arab|immigrant|refugee|disabled|autistic|gay|lesbian|bisexual|queer|trans|transgender|women|woman|men|man|girls|boys|people of color|poc)\\b(?:\\s+people|\\s+person|\\s+folks|\\s+community|\\s+users)?";

const HIGH_CONFIDENCE_PATTERNS: { category: string; pattern: RegExp }[] = [
  {
    category: "protected_group_violence",
    pattern: new RegExp(
      `\\b(?:kill|murder|exterminate|eliminate|wipe out|gas|lynch|hang|shoot|burn|deport)\\s+(?:all\\s+|every\\s+|the\\s+|those\\s+)?${PROTECTED_GROUP_PATTERN}`,
      "i"
    ),
  },
  {
    category: "protected_group_violence",
    pattern: new RegExp(
      `\\b${PROTECTED_GROUP_PATTERN}\\s+(?:should|must|need to|deserve to)\\s+(?:die|be killed|be murdered|be exterminated|be eliminated|be wiped out|be deported|be gassed|be lynched|be hanged|be shot|be burned)\\b`,
      "i"
    ),
  },
  {
    category: "protected_group_exclusion",
    pattern: new RegExp(
      `\\b(?:no|ban|keep out|remove)\\s+${PROTECTED_GROUP_PATTERN}\\b`,
      "i"
    ),
  },
  {
    category: "protected_group_hatred",
    pattern: new RegExp(
      `\\b(?:i\\s+)?hate\\s+(?:all\\s+|every\\s+|the\\s+)?${PROTECTED_GROUP_PATTERN}`,
      "i"
    ),
  },
  {
    category: "protected_group_dehumanization",
    pattern: new RegExp(
      `\\b${PROTECTED_GROUP_PATTERN}\\s+(?:are|r)\\s+(?:animals|vermin|parasites|subhuman|a disease|a plague|filth|trash)\\b`,
      "i"
    ),
  },
];

const HIGH_CONFIDENCE_SLURS = [
  /\bn[i1!]gg(?:e|3)r?s?\b/i,
  /\bf[a@]gg[o0]ts?\b/i,
  /\bk[i1!]kes?\b/i,
  /\bch[i1!]nks?\b/i,
  /\bsp[i1!]cs?\b/i,
  /\btr[a@]nn(?:y|ies)\b/i,
  /\br[e3]t[a@]rds?\b/i,
];

function normalizeForModeration(content: string) {
  return content
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[!1|]/g, "i")
    .replace(/[@4]/g, "a")
    .replace(/[03]/g, (value) => (value === "0" ? "o" : "e"))
    .replace(/[$5]/g, "s")
    .replace(/7/g, "t")
    .replace(/\s+/g, " ")
    .trim();
}

export function moderateHateSpeech(content: string): HateSpeechDecision {
  const normalizedContent = normalizeForModeration(content);
  const categories = new Set<string>();

  for (const rule of HIGH_CONFIDENCE_PATTERNS) {
    if (rule.pattern.test(normalizedContent)) {
      categories.add(rule.category);
    }
  }

  for (const slurPattern of HIGH_CONFIDENCE_SLURS) {
    if (slurPattern.test(normalizedContent)) {
      categories.add("identity_slur");
    }
  }

  if (categories.size > 0) {
    return {
      allowed: false,
      reason: `Blocked pre-post moderation categories: ${Array.from(
        categories
      ).join(", ")}`,
      message: BLOCK_MESSAGE,
      categories: Array.from(categories),
    };
  }

  return {
    allowed: true,
    categories: [],
  };
}
