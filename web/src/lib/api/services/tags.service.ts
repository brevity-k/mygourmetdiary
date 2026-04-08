import type { TagCategory, TagTaxonomy } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';

const CACHE_KEY = 'tags:all';
const CACHE_TTL = 86400; // 24 hours

function filterTags(tags: TagTaxonomy[], category?: TagCategory, group?: string) {
  let result = tags;
  if (category) {
    result = result.filter((t) => t.category === category);
  }
  if (group) {
    result = result.filter((t) => t.group === group);
  }
  return result;
}

export const tagsService = {
  async findAll(category?: TagCategory, group?: string) {
    // Try cache for full set
    const cached = await getJson<TagTaxonomy[]>(CACHE_KEY);
    if (cached) {
      return filterTags(cached, category, group);
    }

    const tags = await prisma.tagTaxonomy.findMany({
      orderBy: [{ category: 'asc' }, { group: 'asc' }, { name: 'asc' }],
    });

    await setJson(CACHE_KEY, tags, CACHE_TTL);
    return filterTags(tags, category, group);
  },
};
