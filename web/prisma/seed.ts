import { PrismaClient, TagCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.SUPABASE_DB_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

interface TagSeed {
  category: TagCategory;
  group: string;
  name: string;
  emoji?: string;
}

const tags: TagSeed[] = [
  // ─── Cuisine Types ────────────────────────────
  { category: 'CUISINE', group: 'Cuisine', name: 'Japanese', emoji: '🇯🇵' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Korean', emoji: '🇰🇷' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Chinese', emoji: '🇨🇳' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Thai', emoji: '🇹🇭' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Vietnamese', emoji: '🇻🇳' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Indian', emoji: '🇮🇳' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Italian', emoji: '🇮🇹' },
  { category: 'CUISINE', group: 'Cuisine', name: 'French', emoji: '🇫🇷' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Mexican', emoji: '🇲🇽' },
  { category: 'CUISINE', group: 'Cuisine', name: 'American', emoji: '🇺🇸' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Mediterranean', emoji: '🫒' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Middle Eastern', emoji: '🧆' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Seafood', emoji: '🦞' },
  { category: 'CUISINE', group: 'Cuisine', name: 'BBQ', emoji: '🔥' },
  { category: 'CUISINE', group: 'Cuisine', name: 'Vegan', emoji: '🌱' },

  // ─── Restaurant Flavor Tags ───────────────────
  { category: 'RESTAURANT', group: 'Flavor', name: 'Savory', emoji: '🧂' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Sweet', emoji: '🍯' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Spicy', emoji: '🌶️' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Sour', emoji: '🍋' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Bitter', emoji: '🍵' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Umami', emoji: '🍄' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Smoky', emoji: '💨' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Rich', emoji: '🧈' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Light', emoji: '🥗' },
  { category: 'RESTAURANT', group: 'Flavor', name: 'Crispy', emoji: '🥐' },

  { category: 'RESTAURANT', group: 'Texture', name: 'Tender', emoji: '🥩' },
  { category: 'RESTAURANT', group: 'Texture', name: 'Crunchy' },
  { category: 'RESTAURANT', group: 'Texture', name: 'Creamy' },
  { category: 'RESTAURANT', group: 'Texture', name: 'Chewy' },
  { category: 'RESTAURANT', group: 'Texture', name: 'Silky' },
  { category: 'RESTAURANT', group: 'Texture', name: 'Flaky' },

  { category: 'RESTAURANT', group: 'Quality', name: 'Fresh Ingredients' },
  { category: 'RESTAURANT', group: 'Quality', name: 'Great Presentation' },
  { category: 'RESTAURANT', group: 'Quality', name: 'Generous Portion' },
  { category: 'RESTAURANT', group: 'Quality', name: 'Good Value' },

  // ─── Wine Aroma (Nose) Tags ───────────────────
  { category: 'WINE', group: 'Nose', name: 'Red Fruit', emoji: '🍒' },
  { category: 'WINE', group: 'Nose', name: 'Dark Fruit', emoji: '🫐' },
  { category: 'WINE', group: 'Nose', name: 'Citrus', emoji: '🍊' },
  { category: 'WINE', group: 'Nose', name: 'Tropical Fruit', emoji: '🥭' },
  { category: 'WINE', group: 'Nose', name: 'Stone Fruit', emoji: '🍑' },
  { category: 'WINE', group: 'Nose', name: 'Floral', emoji: '🌸' },
  { category: 'WINE', group: 'Nose', name: 'Herbaceous', emoji: '🌿' },
  { category: 'WINE', group: 'Nose', name: 'Earthy', emoji: '🍂' },
  { category: 'WINE', group: 'Nose', name: 'Oak', emoji: '🪵' },
  { category: 'WINE', group: 'Nose', name: 'Vanilla' },
  { category: 'WINE', group: 'Nose', name: 'Mineral' },
  { category: 'WINE', group: 'Nose', name: 'Spice' },

  // ─── Wine Palate Tags ─────────────────────────
  { category: 'WINE', group: 'Palate', name: 'Dry' },
  { category: 'WINE', group: 'Palate', name: 'Off-Dry' },
  { category: 'WINE', group: 'Palate', name: 'Sweet' },
  { category: 'WINE', group: 'Palate', name: 'Full-Bodied' },
  { category: 'WINE', group: 'Palate', name: 'Medium-Bodied' },
  { category: 'WINE', group: 'Palate', name: 'Light-Bodied' },
  { category: 'WINE', group: 'Palate', name: 'Tannic' },
  { category: 'WINE', group: 'Palate', name: 'Smooth' },
  { category: 'WINE', group: 'Palate', name: 'Acidic' },
  { category: 'WINE', group: 'Palate', name: 'Balanced' },
  { category: 'WINE', group: 'Palate', name: 'Complex' },
  { category: 'WINE', group: 'Palate', name: 'Crisp' },
  { category: 'WINE', group: 'Palate', name: 'Velvety' },
  { category: 'WINE', group: 'Palate', name: 'Round' },

  // ─── Spirit Nose Tags ─────────────────────────
  { category: 'SPIRIT', group: 'Nose', name: 'Caramel', emoji: '🍮' },
  { category: 'SPIRIT', group: 'Nose', name: 'Vanilla', emoji: '🍦' },
  { category: 'SPIRIT', group: 'Nose', name: 'Honey', emoji: '🍯' },
  { category: 'SPIRIT', group: 'Nose', name: 'Smoke', emoji: '💨' },
  { category: 'SPIRIT', group: 'Nose', name: 'Peat' },
  { category: 'SPIRIT', group: 'Nose', name: 'Fruit' },
  { category: 'SPIRIT', group: 'Nose', name: 'Grain' },
  { category: 'SPIRIT', group: 'Nose', name: 'Floral' },
  { category: 'SPIRIT', group: 'Nose', name: 'Spice' },
  { category: 'SPIRIT', group: 'Nose', name: 'Citrus' },
  { category: 'SPIRIT', group: 'Nose', name: 'Oak' },
  { category: 'SPIRIT', group: 'Nose', name: 'Herbal' },

  // ─── Spirit Palate Tags ───────────────────────
  { category: 'SPIRIT', group: 'Palate', name: 'Smooth' },
  { category: 'SPIRIT', group: 'Palate', name: 'Bold' },
  { category: 'SPIRIT', group: 'Palate', name: 'Warming' },
  { category: 'SPIRIT', group: 'Palate', name: 'Sweet' },
  { category: 'SPIRIT', group: 'Palate', name: 'Dry' },
  { category: 'SPIRIT', group: 'Palate', name: 'Rich' },
  { category: 'SPIRIT', group: 'Palate', name: 'Light' },
  { category: 'SPIRIT', group: 'Palate', name: 'Complex' },
  { category: 'SPIRIT', group: 'Palate', name: 'Oily' },
  { category: 'SPIRIT', group: 'Palate', name: 'Crisp' },

  // ─── Spirit Finish Tags ───────────────────────
  { category: 'SPIRIT', group: 'Finish', name: 'Short Finish' },
  { category: 'SPIRIT', group: 'Finish', name: 'Medium Finish' },
  { category: 'SPIRIT', group: 'Finish', name: 'Long Finish' },
  { category: 'SPIRIT', group: 'Finish', name: 'Lingering Spice' },
  { category: 'SPIRIT', group: 'Finish', name: 'Lingering Sweetness' },
  { category: 'SPIRIT', group: 'Finish', name: 'Clean Finish' },
  { category: 'SPIRIT', group: 'Finish', name: 'Smoky Finish' },
  { category: 'SPIRIT', group: 'Finish', name: 'Bitter Finish' },
];

async function main() {
  console.log('Seeding tag taxonomy...');

  for (const tag of tags) {
    await prisma.tagTaxonomy.upsert({
      where: {
        category_name: { category: tag.category, name: tag.name },
      },
      update: { group: tag.group, emoji: tag.emoji },
      create: tag,
    });
  }

  console.log(`Seeded ${tags.length} tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
