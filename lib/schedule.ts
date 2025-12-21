export type BlockType =
  | "Feeding"
  | "Awake / Play"
  | "Nap"
  | "Night Routine"
  | "Night sleep";

export type Block = {
  id: string;
  start: Date;
  end?: Date | null;
  type: BlockType;
};

export const DEFAULT_NAME = "Francis";
export const DEFAULT_FIRST_FEED = "07:00";
export const DEFAULT_INTERVAL_HOURS = 3;
export const DEFAULT_LAST_FEED = "19:00";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const FEED_DURATION_MINUTES = 30;
const AWAKE_DURATION_MINUTES = 60;
const NAP_DURATION_MINUTES = 90;
const NIGHT_ROUTINE_MINUTES = 30;

export const parseTimeToDate = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map((part) => Number(part));
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const formatDateToTimeString = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

export const normalizeTimeInput = (value: string | null, fallback: string) =>
  value && TIME_PATTERN.test(value) ? value : fallback;

export const normalizeInterval = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return value > 0 ? value : DEFAULT_INTERVAL_HOURS;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_HOURS;
};

export const generateSchedule = (
  firstFeedTime: string,
  intervalHours: number,
  lastFeedTime: string
): Block[] => {
  const firstFeed = parseTimeToDate(firstFeedTime);
  const lastFeed = parseTimeToDate(lastFeedTime);
  const intervalMs = intervalHours * 60 * 60 * 1000;

  if (intervalHours <= 0 || firstFeed.getTime() > lastFeed.getTime()) {
    return [];
  }

  const feedTimes: Date[] = [];
  for (
    let currentFeed = firstFeed;
    currentFeed.getTime() <= lastFeed.getTime();
    currentFeed = new Date(currentFeed.getTime() + intervalMs)
  ) {
    feedTimes.push(new Date(currentFeed));
  }

  const blocks: Block[] = [];

  feedTimes.forEach((feedStart, index) => {
    const feedEnd = addMinutes(feedStart, FEED_DURATION_MINUTES);
    const isLastFeed = index === feedTimes.length - 1;
    const isPenultimateFeed = index === feedTimes.length - 2;
    const nextFeedStart = feedTimes[index + 1];

    blocks.push({
      id: `feed-${index}`,
      start: feedStart,
      end: feedEnd,
      type: "Feeding",
    });

    if (isLastFeed) {
      blocks.push({
        id: `night-${index}`,
        start: new Date(feedEnd),
        end: null,
        type: "Night sleep",
      });
      return;
    }

    const awakeStart = new Date(feedEnd);
    const awakeEnd = addMinutes(awakeStart, AWAKE_DURATION_MINUTES);
    blocks.push({
      id: `awake-${index}`,
      start: awakeStart,
      end: awakeEnd,
      type: "Awake / Play",
    });

    const napStart = new Date(awakeEnd);
    let napEnd = addMinutes(napStart, NAP_DURATION_MINUTES);

    if (isPenultimateFeed && nextFeedStart) {
      const routineStart = addMinutes(nextFeedStart, -NIGHT_ROUTINE_MINUTES);
      if (routineStart.getTime() > napStart.getTime()) {
        napEnd = routineStart;
      }
    }

    blocks.push({
      id: `nap-${index}`,
      start: napStart,
      end: napEnd,
      type: "Nap",
    });

    if (isPenultimateFeed && nextFeedStart && napEnd.getTime() < nextFeedStart.getTime()) {
      blocks.push({
        id: `routine-${index}`,
        start: new Date(napEnd),
        end: nextFeedStart,
        type: "Night Routine",
      });
    }
  });

  return blocks;
};

export const findActiveBlock = (blocks: Block[], now: Date) => {
  for (const block of blocks) {
    if (block.end) {
      if (now >= block.start && now < block.end) {
        return block.id;
      }
    } else if (now >= block.start) {
      return block.id;
    }
  }

  return null;
};
