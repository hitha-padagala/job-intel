This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# JobIntel

JobIntel is a job intelligence dashboard that highlights the most posted jobs on Naukri and Indeed, along with premium insights for skills that are booming.

## Features

- Live keyword search that scrapes the first 10 pages from Naukri
- Indeed scraping placeholder (blocked by 403/CAPTCHA without a dedicated proxy)
- Premium advantage insights to target high-converting services
- API placeholders ready for live integrations

## Scraping Implementation

### API Route

`GET /api/scrape?keyword=your+keyword` returns the first 10 result pages from each source:

```json
{
  "keyword": "android",
  "naukri": [
    { "source": "Naukri", "page": 1, "listings": [/* ... */] }
  ],
  "indeed": [
    { "source": "Indeed", "page": 1, "listings": [], "error": "Failed to fetch ... (403)" }
  ]
}
```

### Naukri

- Naukri pages are fetched through the `r.jina.ai` proxy to avoid client-side rendering issues.
- The response is markdown, so the scraper extracts job links/titles from markdown link patterns like:
  `[Android Developer](https://www.naukri.com/job-listings-...)`.

### Indeed

- Direct requests to Indeed currently return a 403 (security check / CAPTCHA).
- To enable Indeed scraping, you’ll need to wire in a paid scraping proxy or official API and update the request logic.

### UI

The main page (`app/page.tsx`) provides a keyword search box and renders a summary plus sample listings.
If a source fails (e.g., Indeed), the error is shown per-page in the summary panel.

## Environment Variables (optional)

Add the following to a `.env.local` file to point to real APIs when ready:

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
