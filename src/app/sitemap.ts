import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/about', '/team', '/sessions', '/policies', '/privacy']
  return routes.map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
