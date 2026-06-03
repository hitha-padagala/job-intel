import { chromium, type Browser, type Page } from "playwright";

const MAX_PAGES = 3;
const keyword = process.argv[2]?.trim() || "software developer";

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

const buildNaukriUrl = (searchTerm: string, page: number) => {
  const slug = encodeURIComponent(searchTerm.trim().replace(/\s+/g, "-"));
  const query = encodeURIComponent(searchTerm.trim()).replace(/%20/g, "+");
  const baseUrl = `https://www.naukri.com/${slug}-jobs?k=${query}`;

  if (page === 1) {
    return baseUrl;
  }
  return `${baseUrl}&pageNo=${page}`;
};

const scrapeNaukri = async (): Promise<ScrapeResult[]> => {
  const results: ScrapeResult[] = [];

  let browser: Browser | null = null;

  try {
    console.log("Launching new Chrome instance...");
    browser = await chromium.launch({
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    console.log("Browser launched, creating new page...");
    const page: Page = await browser.newPage();

    await page.goto("https://www.naukri.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log("Please log in manually if needed. Press Enter to continue...");

    await new Promise((resolve) => {
      process.stdin.once("data", resolve);
    });

    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      try {
        const url = buildNaukriUrl(keyword, pageNumber);
        console.log(`Navigating to page ${pageNumber}: ${url}`);

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        await page.waitForSelector(".jobTuple", { timeout: 30000 });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const listings = await page.evaluate(() => {
          const cards = document.querySelectorAll(".jobTuple");
          return Array.from(cards)
            .map((card) => {
              const titleEl = card.querySelector(
                ".title",
              ) as HTMLElement | null;
              const companyEl = card.querySelector(
                ".companyInfo .name",
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

              return {
                title: titleEl?.innerText?.trim() ?? "",
                company: companyEl?.innerText?.trim() ?? "",
                location: locEl?.innerText?.trim() ?? "",
                experience: expEl?.innerText?.trim() ?? "",
                link: linkEl?.href ?? "",
              };
            })
            .filter((job) => job.title);
        });

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

scrapeNaukri()
  .then((naukri) => {
    const flattened = naukri.flatMap((page) => page.listings);
    const mostPosted = buildMostPosted(flattened);

    const output = {
      source: "Naukri",
      keyword,
      baseUrl: buildNaukriUrl(keyword, 1),
      pages: MAX_PAGES,
      naukri,
      mostPosted,
    };

    console.log(JSON.stringify(output, null, 2));
  })
  .catch((error) => {
    console.error("Scrape error:", error);
    process.exit(1);
  });
