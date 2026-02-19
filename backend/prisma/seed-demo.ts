import { PrismaClient, BinderCategory, NoteType, Visibility } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // ─── Demo Users ──────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { firebaseUid: 'demo-alice-001' },
    update: {},
    create: {
      firebaseUid: 'demo-alice-001',
      email: 'alice@demo.gourmet',
      displayName: 'Alice (Demo)',
    },
  });
  console.log(`  User: ${alice.displayName} (${alice.id})`);

  const bob = await prisma.user.upsert({
    where: { firebaseUid: 'demo-bob-001' },
    update: {},
    create: {
      firebaseUid: 'demo-bob-001',
      email: 'bob@demo.gourmet',
      displayName: 'Bob (Demo)',
    },
  });
  console.log(`  User: ${bob.displayName} (${bob.id})`);

  // ─── Default Binders ────────────────────────────────────
  const defaultBinderDefs = [
    { name: 'My Restaurant Notes', category: BinderCategory.RESTAURANT },
    { name: 'My Wine Notes', category: BinderCategory.WINE },
    { name: 'My Spirit Notes', category: BinderCategory.SPIRIT },
    { name: 'My Winery Visits', category: BinderCategory.MIXED },
  ];

  const userBinders: Record<string, Record<string, string>> = {
    [alice.id]: {},
    [bob.id]: {},
  };

  for (const user of [alice, bob]) {
    const existing = await prisma.binder.count({
      where: { ownerId: user.id, isDefault: true },
    });
    if (existing === 0) {
      for (const def of defaultBinderDefs) {
        const binder = await prisma.binder.create({
          data: {
            ownerId: user.id,
            name: def.name,
            category: def.category,
            isDefault: true,
            visibility: Visibility.PUBLIC,
          },
        });
        userBinders[user.id][def.category] = binder.id;
      }
    } else {
      const binders = await prisma.binder.findMany({
        where: { ownerId: user.id, isDefault: true },
      });
      for (const b of binders) {
        userBinders[user.id][b.category] = b.id;
      }
    }
  }
  console.log('  Default binders ensured for both users');

  // ─── Demo Venue ──────────────────────────────────────────
  const venue = await prisma.venue.upsert({
    where: { placeId: 'demo-place-la-ramen-001' },
    update: {},
    create: {
      placeId: 'demo-place-la-ramen-001',
      name: 'Tsujita LA Artisan Noodle',
      address: '2057 Sawtelle Blvd, Los Angeles, CA 90025',
      lat: 34.0375,
      lng: -118.4352,
      types: ['restaurant', 'food', 'point_of_interest'],
    },
  });
  console.log(`  Venue: ${venue.name}`);

  // ─── Restaurant Notes (5 overlapping for TSS) ───────────
  const restaurantDishes = [
    { dish: 'Tsukemen', aliceRating: 9, bobRating: 8 },
    { dish: 'Tonkotsu Ramen', aliceRating: 8, bobRating: 9 },
    { dish: 'Miso Ramen', aliceRating: 7, bobRating: 7 },
    { dish: 'Gyoza', aliceRating: 8, bobRating: 8 },
    { dish: 'Chashu Don', aliceRating: 6, bobRating: 7 },
  ];

  for (let i = 0; i < restaurantDishes.length; i++) {
    const d = restaurantDishes[i];
    const dayOffset = i + 1;

    for (const { user, rating } of [
      { user: alice, rating: d.aliceRating },
      { user: bob, rating: d.bobRating },
    ]) {
      const noteId = `demo-note-${user.id.slice(0, 8)}-r${i}`;
      const existing = await prisma.note.findFirst({
        where: { authorId: user.id, title: d.dish },
      });
      if (!existing) {
        await prisma.note.create({
          data: {
            authorId: user.id,
            binderId: userBinders[user.id][BinderCategory.RESTAURANT],
            type: NoteType.RESTAURANT,
            title: d.dish,
            rating,
            visibility: Visibility.PUBLIC,
            tagIds: [],
            extension: {
              dishName: d.dish,
              dishCategory: 'Main',
              wouldOrderAgain: rating >= 7,
            },
            venueId: venue.id,
            experiencedAt: new Date(`2026-01-${String(dayOffset).padStart(2, '0')}`),
          },
        });
      }
    }
  }
  console.log('  5 overlapping restaurant notes per user (10 total)');

  // ─── Wine Notes for Alice (3 — below TSS threshold) ─────
  const wines = [
    { name: 'Opus One 2019', rating: 9, type: 'Red' },
    { name: 'Cloudy Bay Sauvignon Blanc 2022', rating: 7, type: 'White' },
    { name: 'Veuve Clicquot Brut', rating: 8, type: 'Sparkling' },
  ];

  for (let i = 0; i < wines.length; i++) {
    const w = wines[i];
    const existing = await prisma.note.findFirst({
      where: { authorId: alice.id, title: w.name },
    });
    if (!existing) {
      await prisma.note.create({
        data: {
          authorId: alice.id,
          binderId: userBinders[alice.id][BinderCategory.WINE],
          type: NoteType.WINE,
          title: w.name,
          rating: w.rating,
          visibility: Visibility.PUBLIC,
          tagIds: [],
          extension: {
            wineName: w.name,
            wineType: w.type,
          },
          experiencedAt: new Date(`2026-02-${String(i + 1).padStart(2, '0')}`),
        },
      });
    }
  }
  console.log('  3 wine notes for Alice (below TSS threshold)');

  console.log('\nDemo seed complete!');
  console.log('  Login as Alice: Bearer dev:demo-alice-001');
  console.log('  Login as Bob:   Bearer dev:demo-bob-001');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
