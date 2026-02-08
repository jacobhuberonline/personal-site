export type SuperbowlQuestionOption = {
  value: string;
  label: string;
};

export type SuperbowlQuestion = {
  id: string;
  event_id: string;
  key: string;
  section: string;
  label: string;
  description: string | null;
  type: "single_choice" | "score" | "text";
  options: SuperbowlQuestionOption[] | null;
  points: number;
  order_index: number | null;
};

export type SuperbowlEntry = {
  id: string;
  event_id: string;
  user_id: string;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SuperbowlEvent = {
  id: string;
  name: string;
  starts_at: string;
  is_active: boolean;
};

export const SUPERBOWL_HERO_IMAGE_URL =
  "https://static.www.nfl.com/image/upload/q_auto%2Cf_auto%2Cdpr_2.0/league/uakbu3x2xrsdhfk7mmmr";
export const SUPERBOWL_META_IMAGE_URL = SUPERBOWL_HERO_IMAGE_URL;
export const SUPERBOWL_META_IMAGE_ALT = "Super Bowl LX official logo";

export const MVP_OTHER_CHOICE = "Other";

export function getChoiceValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "choice" in value) {
    const choice = (value as { choice?: unknown }).choice;
    return typeof choice === "string" ? choice : null;
  }
  return null;
}

export function getOtherText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const text = (value as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

export function buildOtherValue(text: string) {
  return { choice: MVP_OTHER_CHOICE, text };
}

export function formatScoreValue(value: unknown) {
  if (!value || typeof value !== "object") return "—";
  const sea = (value as { sea?: number | null }).sea;
  const ne = (value as { ne?: number | null }).ne;
  const seaLabel = typeof sea === "number" ? sea.toString() : "—";
  const neLabel = typeof ne === "number" ? ne.toString() : "—";
  return `SEA ${seaLabel} · NE ${neLabel}`;
}

export function formatChoiceLabel(question: SuperbowlQuestion, choice: string | null) {
  if (!choice) return "—";
  if (!question.options) return choice;
  const match = question.options.find((option) => option.value === choice);
  return match?.label ?? choice;
}

export function formatAnswerValue(question: SuperbowlQuestion, value: unknown) {
  if (value === null || value === undefined) return "—";
  if (question.type === "score") {
    return formatScoreValue(value);
  }
  if (question.type === "text") {
    return typeof value === "string" && value.trim() ? value : "—";
  }
  const choice = getChoiceValue(value);
  if (choice === MVP_OTHER_CHOICE) {
    const text = getOtherText(value);
    return text ? `Other: ${text}` : "Other";
  }
  return formatChoiceLabel(question, choice);
}

export function groupQuestionsBySection(questions: SuperbowlQuestion[]) {
  const groups = new Map<string, SuperbowlQuestion[]>();
  questions.forEach((question) => {
    if (!groups.has(question.section)) {
      groups.set(question.section, []);
    }
    groups.get(question.section)?.push(question);
  });

  return Array.from(groups.entries()).map(([section, items]) => ({
    section,
    questions: items,
  }));
}

export function formatEventTime(startsAt: string) {
  const date = new Date(startsAt);
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
  return formatter.format(date);
}
