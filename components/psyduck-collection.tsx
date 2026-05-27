"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ExternalLink,
  Grid2X2,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkHoardTargetIds,
  collectionPhases,
  getCardsById,
  getPsyduckCollectionStats,
  isChaseCard,
  nextRecommendedBuyIds,
  phaseRank,
  psyduckCards,
  type CardPhase,
  type PsyduckCard,
} from "@/data/psyduckCollection";
import { cn } from "@/lib/utils";

type FilterKey =
  | "All"
  | "Owned"
  | "Need to Buy"
  | "Core Psyduck"
  | "Cameos"
  | "Other Purchases"
  | "Phase 1"
  | "Phase 2"
  | "Phase 3"
  | "Phase 4"
  | "Phase 5"
  | "Phase 6";

type SortKey =
  | "phase"
  | "price-asc"
  | "price-desc"
  | "owned-first"
  | "need-first";

const filterOptions: FilterKey[] = [
  "All",
  "Owned",
  "Need to Buy",
  "Core Psyduck",
  "Cameos",
  "Other Purchases",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Phase 5",
  "Phase 6",
];

const sortLabels: Record<SortKey, string> = {
  phase: "Phase",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
  "owned-first": "Owned first",
  "need-first": "Need to buy first",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const summaryStats = getPsyduckCollectionStats();
const recommendedBuys = getCardsById(nextRecommendedBuyIds);
const bulkHoardCards = getCardsById(bulkHoardTargetIds);

const phaseSummaries = collectionPhases.map((phase) => {
  const phaseCards = psyduckCards.filter((card) => card.phase === phase);
  return {
    phase,
    owned: phaseCards.filter((card) => card.status === "Owned").length,
    needed: phaseCards.filter((card) => card.status === "Need to Buy").length,
    total: phaseCards.length,
  };
});

function formatCurrency(value?: number) {
  return typeof value === "number" ? currencyFormatter.format(value) : "n/a";
}

function phaseLabel(phase: CardPhase) {
  return phase.split(" - ")[0];
}

function matchesFilter(card: PsyduckCard, filter: FilterKey) {
  if (filter === "All") {
    return true;
  }

  if (filter === "Owned" || filter === "Need to Buy") {
    return card.status === filter;
  }

  if (filter === "Core Psyduck") {
    return card.category === "Core Psyduck";
  }

  if (filter === "Cameos") {
    return card.category === "Psyduck Cameo";
  }

  if (filter === "Other Purchases") {
    return card.category === "Other Purchase";
  }

  return phaseLabel(card.phase) === filter;
}

function matchesSearch(card: PsyduckCard, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    card.name,
    card.set,
    card.number,
    card.variant,
    card.category,
    card.phase,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function marketSortValue(card: PsyduckCard, fallback: number) {
  return card.marketPrice ?? fallback;
}

function sortCards(cards: PsyduckCard[], sortKey: SortKey) {
  const sortedCards = [...cards];

  sortedCards.sort((a, b) => {
    if (sortKey === "price-asc") {
      return (
        marketSortValue(a, Number.POSITIVE_INFINITY) -
          marketSortValue(b, Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name)
      );
    }

    if (sortKey === "price-desc") {
      return (
        marketSortValue(b, -1) - marketSortValue(a, -1) ||
        a.name.localeCompare(b.name)
      );
    }

    if (sortKey === "owned-first") {
      return (
        Number(b.status === "Owned") - Number(a.status === "Owned") ||
        compareByPhase(a, b)
      );
    }

    if (sortKey === "need-first") {
      return (
        Number(b.status === "Need to Buy") -
          Number(a.status === "Need to Buy") || compareByPhase(a, b)
      );
    }

    return compareByPhase(a, b);
  });

  return sortedCards;
}

function compareByPhase(a: PsyduckCard, b: PsyduckCard) {
  return (
    (phaseRank.get(a.phase) ?? 99) - (phaseRank.get(b.phase) ?? 99) ||
    a.category.localeCompare(b.category) ||
    a.name.localeCompare(b.name) ||
    a.set.localeCompare(b.set)
  );
}

function chunkCards(cards: PsyduckCard[], size: number) {
  const rows: PsyduckCard[][] = [];

  for (let index = 0; index < cards.length; index += size) {
    rows.push(cards.slice(index, index + size));
  }

  return rows;
}

export function PsyduckCollection() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("phase");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCards = useMemo(
    () =>
      psyduckCards.filter(
        (card) =>
          matchesFilter(card, activeFilter) &&
          matchesSearch(card, normalizedSearch)
      ),
    [activeFilter, normalizedSearch]
  );

  const visibleCards = useMemo(
    () => sortCards(filteredCards, sortKey),
    [filteredCards, sortKey]
  );

  const binderRows = useMemo(() => chunkCards(visibleCards, 4), [visibleCards]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <section className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold text-neutral-950 sm:text-4xl dark:text-neutral-50">
            Psyduck Card Collection
          </h1>
          <p className="text-base leading-7 text-neutral-700 dark:text-neutral-200">
            A lightweight tracker for core Psyduck cards, artwork cameos, side
            purchases, binder planning, and TCGplayer searches.
          </p>
          <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            Market values are snapshots, not live prices. Cards with a verified
            date use TCGplayer-backed data surfaced through Pokemon TCG price
            sources; cards without a date are still manual. Target prices are
            shown as high/flex values and are excluded from estimated collection
            value.
          </p>
          <p className="max-w-2xl text-xs text-neutral-500 dark:text-neutral-400">
            Card images are served from local site assets sourced from public
            Pokemon TCG image references. Image rights remain with their owners.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard
            label="Owned core Psyduck"
            value={summaryStats.totalOwnedCore.toString()}
            detail={`${summaryStats.totalNeededCore} still needed`}
          />
          <SummaryCard
            label="Needed core Psyduck"
            value={summaryStats.totalNeededCore.toString()}
            detail={`${summaryStats.totalOwnedCore} already bought`}
          />
          <SummaryCard
            label="Owned cameos"
            value={summaryStats.totalOwnedCameos.toString()}
            detail={`${summaryStats.totalNeededCameos} still needed`}
          />
          <SummaryCard
            label="Estimated value"
            value={formatCurrency(summaryStats.estimatedOwnedMarketValue)}
            detail={`${formatCurrency(summaryStats.estimatedNeededMarketValue)} needed`}
          />
          <SummaryCard
            label="Biggest owned card"
            value={summaryStats.biggestOwnedCard?.name ?? "n/a"}
            detail={
              summaryStats.biggestOwnedCard
                ? `${summaryStats.biggestOwnedCard.set} - ${formatCurrency(
                    summaryStats.biggestOwnedCard.marketPrice
                  )}`
                : "No market price"
            }
          />
          <SummaryCard
            label="Next recommended buys"
            value={recommendedBuys.length.toString()}
            detail="Prioritized vintage and 151 targets"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel title="Next Recommended Buys">
          <ol className="space-y-3">
            {recommendedBuys.map((card) => (
              <li
                key={card.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {card.name} - {card.set} {card.number}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {phaseLabel(card.phase)} / {formatCurrency(card.marketPrice)}
                  </p>
                </div>
                <ExternalCardLink card={card} compact />
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Bulk Hoard Target">
          <div className="space-y-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              Psyduck 054/165 from Scarlet & Violet 151. Buy in bulk only when
              shipping is combined.
            </p>
            {bulkHoardCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {card.variant ?? "Standard"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {card.status} / {formatCurrency(card.marketPrice)}
                  </p>
                </div>
                <StatusBadge status={card.status} />
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            Collection Phases
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Phase counts include both owned cards and cards still on the buy
            list.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {phaseSummaries.map(({ phase, owned, needed, total }) => (
            <div
              key={phase}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {phaseLabel(phase)}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                {phase.replace(`${phaseLabel(phase)} - `, "")}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {owned} owned
                </span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {needed} needed
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  {total} total
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <span className="sr-only">Search cards</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
              placeholder="Search card name, set, or number"
            />
          </label>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
          >
            <SelectTrigger aria-label="Sort cards">
              <SelectValue placeholder="Sort cards" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {sortLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                activeFilter === filter
                  ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-300">
          <span>
            Showing {visibleCards.length} of {psyduckCards.length} cards
          </span>
          <span>
            {visibleCards.filter((card) => card.status === "Owned").length}{" "}
            purchased /{" "}
            {
              visibleCards.filter((card) => card.status === "Need to Buy")
                .length
            }{" "}
            need to buy
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={<Grid2X2 className="h-5 w-5" />}
          title="All Cards"
          description="Responsive card tiles with status, prices, notes, and TCGplayer links."
        />
        {visibleCards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Binder View"
          description="Grouped into rows of four for a 4-pocket toploader binder."
        />
        {binderRows.length ? (
          <div className="space-y-4">
            {binderRows.map((row, rowIndex) => (
              <div
                key={`binder-row-${rowIndex}`}
                className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Row {rowIndex + 1}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {row.map((card) => (
                    <BinderSlot key={card.id} card={card} />
                  ))}
                  {Array.from({ length: 4 - row.length }).map((_, index) => (
                    <div
                      key={`empty-slot-${rowIndex}-${index}`}
                      className="min-h-36 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/60"
                      aria-label="Empty binder slot"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Tracking List"
          description="Compact list view for checking ownership, phase, price, and buy links."
        />
        {visibleCards.length ? <TrackingTable cards={visibleCards} /> : <EmptyState />}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-2 truncate text-2xl font-bold text-neutral-950 dark:text-neutral-50">
        {value}
      </div>
      <div className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
        {detail}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
      <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <div className="mt-1 rounded-md bg-neutral-900 p-1.5 text-white dark:bg-neutral-100 dark:text-neutral-950">
          {icon}
        </div>
      ) : null}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
          {title}
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function CardTile({ card }: { card: PsyduckCard }) {
  const isOwned = card.status === "Owned";
  const isChase = isChaseCard(card);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900",
        isOwned
          ? "border-neutral-200 dark:border-neutral-800"
          : "border-dashed border-neutral-300 bg-neutral-50/80 opacity-90 dark:border-neutral-700 dark:bg-neutral-950/60",
        isChase &&
          "ring-1 ring-amber-300/80 dark:ring-amber-500/50"
      )}
    >
      <CardArtwork card={card} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-neutral-950 dark:text-neutral-50">
              {card.name}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {card.set}
              {card.number ? ` - ${card.number}` : ""}
            </p>
          </div>
          <StatusBadge status={card.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{card.category}</Badge>
          <Badge>{phaseLabel(card.phase)}</Badge>
          {card.variant ? <Badge>{card.variant}</Badge> : null}
          {isChase ? <ChaseBadge /> : null}
        </div>

        <dl className="grid grid-cols-3 gap-2 text-xs">
          <PriceStat label="Low" value={formatCurrency(card.lowPrice)} />
          <PriceStat label="Market" value={formatCurrency(card.marketPrice)} />
          <PriceStat
            label={card.targetPrice && card.targetPrice >= 999 ? "Flex" : "Target"}
            value={formatCurrency(card.targetPrice)}
          />
        </dl>

        {card.notes ? (
          <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
            {card.notes}
          </p>
        ) : null}

        <PriceSourceNote card={card} />

        <ExternalCardLink card={card} />
      </div>
    </article>
  );
}

function CardArtwork({ card }: { card: PsyduckCard }) {
  if (card.imageUrl) {
    return (
      <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={card.imageUrl}
          alt={`${card.name} ${card.set} ${card.number ?? ""}`.trim()}
          fill
          className="object-contain p-2"
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-[3/4] flex-col justify-between bg-gradient-to-br from-sky-100 via-amber-100 to-white p-4 dark:from-sky-950 dark:via-amber-950/50 dark:to-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-sm dark:bg-neutral-950/60 dark:text-neutral-200">
          {card.category === "Core Psyduck" ? "Psyduck" : "Cameo"}
        </span>
        {isChaseCard(card) ? <ChaseBadge /> : null}
      </div>
      <div className="space-y-2 rounded-lg border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/50">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
          Placeholder
        </div>
        <div className="text-xl font-bold leading-tight text-neutral-950 dark:text-neutral-50">
          {card.name}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          {card.set}
          {card.number ? ` - ${card.number}` : ""}
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      {children}
    </span>
  );
}

function ChaseBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
      <Sparkles className="h-3 w-3" />
      Chase
    </span>
  );
}

function StatusBadge({ status }: { status: PsyduckCard["status"] }) {
  const isOwned = status === "Owned";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        isOwned
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      )}
    >
      {isOwned ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <ShoppingCart className="h-3.5 w-3.5" />
      )}
      {isOwned ? "Purchased" : "Need to buy"}
    </span>
  );
}

function PriceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-950">
      <dt className="font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-neutral-950 dark:text-neutral-50">
        {value}
      </dd>
    </div>
  );
}

function PriceSourceNote({ card }: { card: PsyduckCard }) {
  if (card.priceUpdatedAt && card.priceSourceUrl) {
    return (
      <a
        href={card.priceSourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-800 hover:decoration-neutral-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:text-neutral-100"
      >
        Price verified {card.priceUpdatedAt}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  if (card.priceSourceUrl) {
    return (
      <a
        href={card.priceSourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-800 hover:decoration-neutral-500 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:text-neutral-100"
      >
        Source linked; price remains manual
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
      Manual placeholder image and price
    </p>
  );
}

function ExternalCardLink({
  card,
  compact = false,
}: {
  card: PsyduckCard;
  compact?: boolean;
}) {
  return (
    <a
      href={card.tcgplayerSearchUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View or buy ${card.name} from ${card.set} on TCGplayer`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 font-semibold text-white transition hover:bg-neutral-800 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200",
        compact ? "h-9 px-3 text-xs" : "h-10 w-full px-4 text-sm"
      )}
    >
      <span>{compact ? "TCGplayer" : "View / Buy on TCGplayer"}</span>
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function BinderSlot({ card }: { card: PsyduckCard }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        card.status === "Owned"
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {phaseLabel(card.phase)}
        </span>
        {card.status === "Owned" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        ) : (
          <ShoppingCart className="h-4 w-4 text-neutral-400" />
        )}
      </div>
      <div className="relative mt-3 aspect-[3/4] overflow-hidden rounded-md bg-white/80 dark:bg-neutral-900">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={`${card.name} ${card.set} ${card.number ?? ""}`.trim()}
            fill
            className="object-contain p-1"
            sizes="(min-width: 640px) 25vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-amber-100 to-white p-3 text-center text-xs font-semibold text-neutral-600 dark:from-sky-950 dark:via-amber-950/50 dark:to-neutral-900 dark:text-neutral-300">
            No image
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-semibold leading-tight text-neutral-950 dark:text-neutral-50">
          {card.name}
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
          {card.set}
          {card.number ? ` - ${card.number}` : ""}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge status={card.status} />
        {isChaseCard(card) ? <ChaseBadge /> : null}
      </div>
    </div>
  );
}

function TrackingTable({ cards }: { cards: PsyduckCard[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="space-y-3 p-3 md:hidden">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-neutral-950 dark:text-neutral-50">
                  {card.name}
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  {card.set}
                  {card.number ? ` - ${card.number}` : ""}
                </p>
              </div>
              <StatusBadge status={card.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <span>{card.category}</span>
              <span>{phaseLabel(card.phase)}</span>
              <span>Market {formatCurrency(card.marketPrice)}</span>
              <span>Target {formatCurrency(card.targetPrice)}</span>
            </div>
            <div className="mt-3">
              <ExternalCardLink card={card} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-200 dark:border-neutral-800">
              <TableHead>Status</TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead className="text-right">Low</TableHead>
              <TableHead className="text-right">Market</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => (
              <TableRow
                key={card.id}
                className="border-neutral-200 dark:border-neutral-800"
              >
                <TableCell>
                  <StatusBadge status={card.status} />
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {card.name}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {card.set}
                    {card.number ? ` - ${card.number}` : ""}
                    {card.variant ? ` / ${card.variant}` : ""}
                  </div>
                </TableCell>
                <TableCell>{card.category}</TableCell>
                <TableCell>{phaseLabel(card.phase)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(card.lowPrice)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(card.marketPrice)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(card.targetPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <ExternalCardLink card={card} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-950/60">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        No cards match the current search and filters.
      </p>
    </div>
  );
}
