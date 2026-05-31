# JobIntel

JobIntel is a job intelligence dashboard that highlights the most posted jobs on Naukri and Indeed, along with premium insights for skills that are booming.

## Latest UI touch-up

- Improved landing-page visual depth with a smoother dark gradient background.
- Clarified search input placeholder copy for better first-use guidance.

## Features

- Live keyword search that scrapes job listings from Naukri using authenticated Chrome session
- Premium advantage insights to target high-converting services
- API placeholders ready for live integrations

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scraping Implementation

### Prerequisites

Before using the scraper, you need to:

1. Install Playwright browsers:

   ```bash
   npx playwright install chromium
   ```

2. Launch Chrome with remote debugging enabled:

   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\hithap\AppData\Local\Google\Chrome\User Data"
   ```

3. Ensure you're logged into Naukri in your Chrome profile

### API Route

`GET /api/scrape` returns job listings from Naukri:

```json
{
  "source": "Naukri",
  "baseUrl": "https://www.naukri.com/software-developer-jobs?k=software+developer",
  "pages": 3,
  "naukri": [
    {
      "source": "Naukri",
      "page": 1,
      "listings": [
        {
          "title": "Software Developer",
          "company": "Company Name",
          "location": "Hyderabad",
          "experience": "4-8 years",
          "link": "https://www.naukri.com/job-listings-...",
          "source": "Naukri",
          "page": 1
        }
      ]
    }
  ],
  "mostPosted": [{ "title": "software developer", "company": "", "count": 42 }]
}
```

### How It Works

The scraper uses Playwright to connect to an already-running Chrome instance via CDP (Chrome DevTools Protocol):

1. Chrome is launched manually with `--remote-debugging-port=9222`
2. The Next.js API route connects to Chrome using `chromium.connectOverCDP()`
3. Uses the existing logged-in session to access Naukri
4. Scrapes job listings from search results pages
5. Returns aggregated results with most-posted job analysis

### Limitation

The scraper connects to an existing Chrome session - you must keep Chrome running with the debugging port open while using the scraper.

## Environment Variables (optional)

Add the following to a `.env.local` file for future API integrations:

```bash
NEXT_PUBLIC_NAUKRI_API_BASE_URL=https://api.naukri.example/v1
NEXT_PUBLIC_NAUKRI_API_KEY=your_naukri_key
NEXT_PUBLIC_INDEED_API_BASE_URL=https://api.indeed.example/v1
NEXT_PUBLIC_INDEED_API_KEY=your_indeed_key
```

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Playwright (for browser automation)
