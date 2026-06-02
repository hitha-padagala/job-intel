import { chromium, type Browser, type Page } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAGES = 3;
const NAUKRI_BASE_URL =
  "https://www.naukri.com/software-developer-jobs?k=software+developer";
const CHROME_DEVTOOLS_PORT = 9222;

type JobListing = {
  title: string;
  company: string;
  location: string;
  experience: string;
  link: string;
  source: "Naukri";
  page: number;
};

type ScrapeResult = {
  source: "Naukri";
  page: number;
  listings: JobListing[];
  error?: string;
};

const buildNaukriUrl = (page: number) => {
  if (page === 1) {
    return NAUKRI_BASE_URL;
  }
  return `${NAUKRI_BASE_URL}&pageNo=${page}`;
};

const scrapeNaukri = async (): Promise<ScrapeResult[]> => {
  const results: ScrapeResult[] = [];

  let browser: Browser | null = null;

  try {
    console.log("Connecting to Chrome via CDP...");
    browser = await chromium.connectOverCDP(
      `http://localhost:${CHROME_DEVTOOLS_PORT}`,
    );
    console.log("Connected to Chrome");

    const pages = await browser.contexts()[0].pages();
    const page = pages[0] || (await browser.newPage());

    if (pages.length === 0) {
      await page.goto("about:blank");
    }

    console.log("Current URL:", await page.url());

    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      try {
        const url = buildNaukriUrl(pageNumber);
        console.log(`Navigating to page ${pageNumber}: ${url}`);

        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        } catch (gotoError) {
          console.log("Navigation aborted, retrying with load...");
          await page.goto(url, { waitUntil: "load", timeout: 60000 });
          await page.waitForLoadState("networkidle").catch(() => {});
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const html = await page.content();
        console.log(`Page ${pageNumber} HTML sample:`, html.slice(0, 2000));

        const hasJobTuple = await page.locator(".jobTuple").count();
        const hasCustJobTuple = await page.locator(".cust-job-tuple").count();
        const hasListing = await page.locator(".listing-card").count();
        console.log(
          `Selectors found - .jobTuple: ${hasJobTuple}, .cust-job-tuple: ${hasCustJobTuple}, .listing-card: ${hasListing}`,
        );

        let selector = ".jobTuple";
        if (hasJobTuple === 0 && hasCustJobTuple > 0)
          selector = ".cust-job-tuple";
        else if (hasJobTuple === 0 && hasListing > 0)
          selector = ".listing-card";

        if (hasJobTuple === 0 && hasCustJobTuple === 0 && hasListing === 0) {
          console.log("No job listings found on page");
          results.push({
            source: "Naukri",
            page: pageNumber,
            listings: [],
            error: "No job listings found",
          });
          continue;
        }

        const listings = await page.evaluate((sel) => {
          const cards = document.querySelectorAll(sel);
          return Array.from(cards)
            .map((card) => {
              const cardEl = card as HTMLElement;
              const titleEl = card.querySelector(
                ".title",
              ) as HTMLElement | null;
              const locEl = card.querySelector(
                ".location",
              ) as HTMLElement | null;
              const expEl = card.querySelector(
                ".experience",
              ) as HTMLElement | null;
              const linkEl = card.querySelector(
                ".title",
              ) as HTMLAnchorElement | null;
              const companyEl = card.querySelector(
                ".companyInfo",
              ) as HTMLElement | null;

              const allText = cardEl.innerText;
              console.log("Card text:", allText);

              return {
                title: titleEl?.innerText?.trim() ?? "",
                company: companyEl?.innerText?.trim() ?? "",
                location: locEl?.innerText?.trim() ?? "",
                experience: expEl?.innerText?.trim() ?? "",
                link: linkEl?.href ?? "",
              };
            })
            .filter((job) => job.title);
        }, selector);

        results.push({
          source: "Naukri",
          page: pageNumber,
          listings: listings.map((listing) => ({
            ...listing,
            source: "Naukri" as const,
            page: pageNumber,
          })),
        });

        console.log(`Page ${pageNumber}: Found ${listings.length} jobs`);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Page ${pageNumber} error:`, errorMsg);
        results.push({
          source: "Naukri",
          page: pageNumber,
          listings: [],
          error: errorMsg,
        });
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
};

const buildMostPosted = (listings: JobListing[]) => {
  const counts = new Map<string, number>();

  for (const listing of listings) {
    const key = `${listing.title}@@${listing.company}`.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [title, company] = key.split("@@");
      return { title, company, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

export async function GET() {
  try {
    const naukri = await scrapeNaukri();
    const flattened = naukri.flatMap((page) => page.listings);
    const mostPosted = buildMostPosted(flattened);

    return Response.json({
      source: "Naukri",
      baseUrl: NAUKRI_BASE_URL,
      pages: MAX_PAGES,
      naukri,
      mostPosted,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
