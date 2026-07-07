import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/team', '/sessions', '/policies', '/privacy'],
      disallow: ['/admin', '/children', '/enrolments', '/waiting-list', '/login', '/register', '/forgot-password', '/reset-password', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
