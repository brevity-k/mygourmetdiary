import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TagCategory } from '@prisma/client';

@Injectable()
export class TagsService {
  private readonly CACHE_KEY = 'tags:all';
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(category?: TagCategory, group?: string) {
    // Try cache for full set
    const cached = await this.redis.getJson<any[]>(this.CACHE_KEY);
    if (cached) {
      return this.filterTags(cached, category, group);
    }

    const tags = await this.prisma.tagTaxonomy.findMany({
      orderBy: [{ category: 'asc' }, { group: 'asc' }, { name: 'asc' }],
    });

    await this.redis.setJson(this.CACHE_KEY, tags, this.CACHE_TTL);
    return this.filterTags(tags, category, group);
  }

  private filterTags(tags: any[], category?: TagCategory, group?: string) {
    let result = tags;
    if (category) {
      result = result.filter((t) => t.category === category);
    }
    if (group) {
      result = result.filter((t) => t.group === group);
    }
    return result;
  }
}
