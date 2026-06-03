"use client";

import { useMemo, useState } from "react";

type JobListing = {
  title: string;
  company: string;
  location: string;
  link: string;
  source: "Naukri" | "Indeed";
  page: number;
};

type ScrapePage = {
  source: "Naukri" | "Indeed";
  page: number;
  listings: JobListing[];
  error?: string;
};

type ScrapeResponse = {
  source: string;
  baseUrl: string;
  pages: number;
  keyword: string;
  naukri: ScrapePage[];
  mostPosted: {
    title: string;
    company: string;
    count: number;
  }[];
};

const premiumSignals = [
  {
    title: "Booming Skills",
    items: ["Generative AI", "Cloud Security", "Data Engineering"],
    note: "Target roles with higher billing rates and premium placement.",
  },
  {
    title: "Premium Filters",
    items: ["Remote-ready", "Enterprise employers", "Urgent hiring"],
    note: "Use premium filters to surface faster-converting roles.",
  },
  {
    title: "Apply Advantage",
    items: ["Early apply window", "Tailored resume", "Skill verification"],
    note: "Boost conversion using premium apply tools and visibility boosts.",
  },
];

const apiConfig = [
  {
    label: "Naukri API",
    baseUrl:
      process.env.NEXT_PUBLIC_NAUKRI_API_BASE_URL ??
      "https://api.naukri.example/v1",
    keyName: "NEXT_PUBLIC_NAUKRI_API_KEY",
  },
  {
    label: "Indeed API",
    baseUrl:
      process.env.NEXT_PUBLIC_INDEED_API_BASE_URL ??
      "https://api.indeed.example/v1",
    keyName: "NEXT_PUBLIC_INDEED_API_KEY",
  },
];

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [response, setResponse] = useState<ScrapeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flattened = useMemo(() => {
    if (!response) {
      return [] as JobListing[];
    }

    return response.naukri.flatMap((page) => page.listings);
  }, [response]);

  const handleSearch = async () => {
    const query = keyword.trim() || "software developer";
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`/api/scrape?keyword=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error("Scrape failed. Please try again.");
      }
      const payload = (await res.json()) as ScrapeResponse;
      setResponse(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !loading) {
      void handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Job Intel Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Track the most posted roles on Naukri & Indeed
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              Build a premium advantage by focusing on roles with the biggest
              demand spikes and the skills that are booming right now.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Live scrape
            </p>
            <p className="text-lg font-semibold">Search Naukri + Indeed</p>
            <p className="text-sm text-slate-400">
              Scrape the first 10 pages from your logged-in Naukri session.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Live job search</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use your logged-in Chrome profile to pull the first 10 pages
                from Naukri.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Software developer (default query)"
                className="w-full rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-200"
              >
                {loading ? "Scraping..." : "Search"}
              </button>
            </div>
          </div>
          {error ? (
            <p className="mt-4 text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          {response ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Summary
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {response.source} • {flattened.length} listings scraped
                </p>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  {response.naukri.map((page) => (
                    <div
                      key={`${page.source}-${page.page}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {page.source} page {page.page}
                      </p>
                      <p className="mt-1 text-sm">
                        {page.error
                          ? `Error: ${page.error}`
                          : `${page.listings.length} listings`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Most posted jobs
                </p>
                <div className="mt-3 grid gap-3 text-sm text-slate-300">
                  {response.mostPosted.map((item) => (
                    <div
                      key={`${item.title}-${item.company}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400">
                        {item.company || "Unknown company"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.count} postings across pages
                      </p>
                    </div>
                  ))}
                  {response.mostPosted.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No listings captured yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Results will appear here after you search.
            </p>
          )}
        </section>
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Scrape notes</h2>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                Live-ready
              </span>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Sources
                </p>
                <p className="mt-2">
                  Scraping targets the first 10 pages on Naukri using your
                  logged-in Chrome profile. Errors are surfaced per page in the
                  results summary.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Next steps
                </p>
                <p className="mt-2">
                  Add persistence, rate limiting, and caching as needed to keep
                  scrapes reliable.
                </p>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Premium advantage</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use these insights to price premium services and pick
                high-converting roles.
              </p>
              <div className="mt-4 grid gap-4">
                {premiumSignals.map((signal) => (
                  <div
                    key={signal.title}
                    className="rounded-2xl border border-white/10 p-4"
                  >
                    <p className="text-sm font-semibold">{signal.title}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {signal.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-slate-500">{signal.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">API placeholders</h2>
              <p className="mt-2 text-sm text-slate-400">
                Swap in official APIs by adding the env vars below.
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {apiConfig.map((config) => (
                  <div
                    key={config.label}
                    className="rounded-2xl border border-white/10 p-4"
                  >
                    <p className="font-semibold">{config.label}</p>
                    <p className="mt-1 text-xs text-slate-400">Base URL</p>
                    <p className="text-sm text-slate-200 break-all">
                      {config.baseUrl}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      API key env var
                    </p>
                    <p className="text-sm text-slate-200">{config.keyName}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recommended next steps</h2>
              <p className="mt-2 text-sm text-slate-400">
                Connect APIs and add premium analytics to monetize job intel.
              </p>
            </div>
            <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">
              Add premium analytics
            </button>
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                1
              </p>
              <p className="mt-2 font-semibold">Verify demand</p>
              <p className="mt-1 text-sm text-slate-400">
                Compare posting velocity across sources to focus on the most
                active roles.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                2
              </p>
              <p className="mt-2 font-semibold">Target premium upsells</p>
              <p className="mt-1 text-sm text-slate-400">
                Bundle resume review, mock interviews, and job alerts for
                high-demand skills.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                3
              </p>
              <p className="mt-2 font-semibold">Automate apply flows</p>
              <p className="mt-1 text-sm text-slate-400">
                Use premium apply tools and notifications to act on fresh
                listings first.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
