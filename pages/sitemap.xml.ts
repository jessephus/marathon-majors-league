/**
 * Dynamic Sitemap Generation for SEO
 * 
 * Generates sitemap.xml with all public pages and dynamic routes.
 * Updates automatically when new races or athletes are added.
 * 
 * SEO Benefits:
 * - Helps search engines discover all pages
 * - Provides last modified dates for crawl optimization
 * - Includes priority hints for important pages
 * - Supports dynamic routes (races, athletes)
 */

import { GetServerSidePropsContext } from 'next';
import { neon } from '@neondatabase/serverless';

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

function generateSiteMap(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }: GetServerSidePropsContext) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marathonmajorsfantasy.com';
  const today = new Date().toISOString().split('T')[0];

  const urls: SitemapUrl[] = [
    // Static pages - High priority
    {
      loc: `${baseUrl}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/leaderboard`,
      lastmod: today,
      changefreq: 'hourly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/race`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/help`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7,
    },
    
    // Athletes page
    {
      loc: `${baseUrl}/athletes`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8,
    },
    
    // Note: /commissioner is excluded (requires authentication)
  ];

  try {
    // Fetch active races for dynamic URLs
    const races = await sql`
      SELECT id, name, date, updated_at
      FROM races
      WHERE is_active = true
      ORDER BY date DESC
      LIMIT 10
    `;

    // Add race pages
    races.forEach((race: any) => {
      urls.push({
        loc: `${baseUrl}/race?id=${race.id}`,
        lastmod: race.updated_at?.split('T')[0] || today,
        changefreq: 'daily',
        priority: 0.8,
      });
    });

    // Fetch top athletes for dynamic URLs (optional - can be slow with many athletes)
    const athletes = await sql`
      SELECT id, name, updated_at
      FROM athletes
      WHERE marathon_rank IS NOT NULL
      ORDER BY marathon_rank ASC
      LIMIT 50
    `;

    // Add athlete pages (top 50 ranked athletes)
    athletes.forEach((athlete: any) => {
      urls.push({
        loc: `${baseUrl}/athletes/${athlete.id}`,
        lastmod: athlete.updated_at?.split('T')[0] || today,
        changefreq: 'weekly',
        priority: 0.6,
      });
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Continue with static pages if database fails
  }

  // Generate the XML sitemap
  const sitemap = generateSiteMap(urls);

  // Set cache headers (cache for 1 hour)
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

// Default export to prevent Next.js errors
export default function Sitemap() {
  return null;
}
