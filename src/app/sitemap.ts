import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trustline.app'
  
  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ]

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return sitemapEntries
  }

  try {
    const supabase = createClient(url, key)
    const { data: listings } = await supabase
      .from('listings')
      .select('slug, location, category, created_at')
      .eq('is_public', true)

    if (listings) {
      listings.forEach((listing) => {
        const cleanLocation = listing.location.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const cleanCategory = listing.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        sitemapEntries.push({
          url: `${baseUrl}/directory/${cleanLocation}/${cleanCategory}/${listing.slug}`,
          lastModified: new Date(listing.created_at || Date.now()),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      })
    }
  } catch (e) {
    console.error('Error generating dynamic sitemap entries:', e)
  }

  return sitemapEntries
}


