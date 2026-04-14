import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/request/', '/api/'],
    },
    sitemap: 'https://arbeidmatch.no/sitemap.xml',
  }
}
