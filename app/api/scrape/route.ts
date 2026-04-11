import { load } from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAGES = 10;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

type JobListing = {
  title: string;
  company: string;
  location: string;
  link: string;
  source: "Naukri" | "Indeed";
  page: number;
};

type ScrapeResult = {
  source: "Naukri" | "Indeed";
  page: number;
  listings: JobListing[];
  error?: string;
};

const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.text();
};

const fetchMarkdown = async (url: string) => {
  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
  const response = await fetch(proxyUrl, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${proxyUrl} (${response.status})`);
  }

  return response.text();
};

const cleanText = (value?: string | null) =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const buildNaukriUrl = (keyword: string, page: number) =>
  `https://www.naukri.com/${encodeURIComponent(keyword)}-jobs-${page}`;

const buildIndeedUrl = (keyword: string, page: number) => {
  const start = (page - 1) * 10;
  return `https://www.indeed.com/jobs?q=${encodeURIComponent(
    keyword,
  )}&start=${start}`;
};

const parseNaukri = (markdown: string, page: number): JobListing[] => {
  const listings: JobListing[] = [];
  const lines = markdown.split("\n");
  const linkPattern =
    /\[(.+?)\]\((https?:\/\/www\.naukri\.com\/job-listings-[^\s\)]*)/i;

  for (const line of lines) {
    const match = line.match(linkPattern);
    if (!match) {
      continue;
    }

    const title = cleanText(match[1]);
    const link = match[2];
    if (!title) {
      continue;
    }

    listings.push({
      title,
      company: "",
      location: "",
      link,
      source: "Naukri",
      page,
    });
  }

  return listings;
};

const parseIndeed = (html: string, page: number): JobListing[] => {
  const $ = load(html);
  const listings: JobListing[] = [];

  $("a.tapItem").each((_, element) => {
    const title = cleanText($(element).find("h2.jobTitle span").text());
    const company = cleanText($(element).find("span.companyName").text());
    const location = cleanText($(element).find("div.companyLocation").text());
    const link = $(element).attr("href")
      ? `https://www.indeed.com${$(element).attr("href")}`
      : "";

    if (title) {
      listings.push({
        title,
        company,
        location,
        link,
        source: "Indeed",
        page,
      });
    }
  });

  return listings;
};

const scrapeSource = async (
  source: "Naukri" | "Indeed",
  keyword: string,
): Promise<ScrapeResult[]> => {
  const results: ScrapeResult[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    try {
      const url =
        source === "Naukri"
          ? buildNaukriUrl(keyword, page)
          : buildIndeedUrl(keyword, page);
      const payload =
        source === "Naukri" ? await fetchMarkdown(url) : await fetchHtml(url);
      const listings =
        source === "Naukri"
          ? parseNaukri(payload, page)
          : parseIndeed(payload, page);
      results.push({ source, page, listings });
    } catch (error) {
      results.push({
        source,
        page,
        listings: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() ?? "";

  if (!keyword) {
    return Response.json(
      { error: "Keyword is required." },
      {
        status: 400,
      },
    );
  }

  const [naukri, indeed] = await Promise.all([
    scrapeSource("Naukri", keyword),
    scrapeSource("Indeed", keyword),
  ]);

  return Response.json({ keyword, naukri, indeed });
}
