import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.trade.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.event.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hbs.edu',
      role: 'ADMIN',
    },
  });

  const users = await Promise.all([
    prisma.user.create({ data: { email: 'john.doe@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'jane.smith@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'bob.wilson@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'alice.brown@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'charlie.davis@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'diana.lee@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'edward.kim@hbs.edu', role: 'USER' } }),
    prisma.user.create({ data: { email: 'fiona.chen@hbs.edu', role: 'USER' } }),
  ]);

  console.log(`✅ Created ${users.length + 1} users`);

  // Create events
  console.log('Creating events...');
  const now = new Date();

  const events = [
    {
      title: 'Harvard Business Conference 2025',
      description: 'Annual conference featuring keynote speakers from Fortune 500 companies and networking opportunities with industry leaders.',
      clubName: 'HBS Business Club',
      eventDateTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      venue: 'Baker Library | Bloomberg Center',
      retailPrice: 75.00,
      maxResaleCap: 125, // 125% of retail
      ticketFormat: 'QR_CODE',
      listingOpenTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      listingCloseTime: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000), // 1 day before event
      resalesEnabled: true,
    },
    {
      title: 'Tech Startup Pitch Night',
      description: 'Watch HBS students pitch their startup ideas to top VCs. Network with entrepreneurs and investors.',
      clubName: 'Entrepreneurship Club',
      eventDateTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      venue: 'Klarman Hall Auditorium',
      retailPrice: 25.00,
      maxResaleCap: 150,
      ticketFormat: 'EVENTBRITE_LINK',
      listingOpenTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      listingCloseTime: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      resalesEnabled: true,
    },
    {
      title: 'Spring Formal Gala',
      description: 'The most anticipated social event of the semester. Black tie optional. Dinner, drinks, and dancing.',
      clubName: 'MBA Class Council',
      eventDateTime: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      venue: 'Boston Harbor Hotel Grand Ballroom',
      retailPrice: 150.00,
      maxResaleCap: 110, // Tight resale cap
      ticketFormat: 'QR_CODE',
      listingOpenTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      listingCloseTime: new Date(now.getTime() + 43 * 24 * 60 * 60 * 1000),
      resalesEnabled: true,
    },
    {
      title: 'Finance Career Trek - NYC',
      description: 'Visit top investment banks and hedge funds in New York City. Limited spots available.',
      clubName: 'Finance Club',
      eventDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: 'Various NYC Locations',
      retailPrice: 50.00,
      maxResaleCap: null, // No cap
      ticketFormat: 'EVENTBRITE_LINK',
      listingOpenTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      listingCloseTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      resalesEnabled: true,
    },
    {
      title: 'Wine & Cheese Networking Night',
      description: 'Casual networking event with wine tasting and artisanal cheese pairings. Meet students from all sections.',
      clubName: 'Wine & Cuisine Club',
      eventDateTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (past event)
      venue: 'Spangler Center Dining Room',
      retailPrice: 35.00,
      maxResaleCap: 140,
      ticketFormat: 'QR_CODE',
      listingOpenTime: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      listingCloseTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago (closed)
      resalesEnabled: true,
    },
  ];

  const createdEvents = await Promise.all(
    events.map(event => prisma.event.create({ data: event }))
  );

  console.log(`✅ Created ${createdEvents.length} events`);

  // Create listings and trades for each event
  console.log('Creating listings and trades...');

  for (const event of createdEvents) {
    const numListings = Math.floor(Math.random() * 8) + 12; // 12-20 listings per event
    const isPastEvent = event.eventDateTime < now;

    for (let i = 0; i < numListings; i++) {
      const seller = users[Math.floor(Math.random() * users.length)];

      // Generate price variation around retail price
      const priceVariation = (Math.random() - 0.5) * 0.4; // +/- 20%
      const basePrice = event.retailPrice * (1 + priceVariation);

      // Apply max resale cap if exists
      let listingPrice = basePrice;
      if (event.maxResaleCap) {
        const maxPrice = event.retailPrice * (event.maxResaleCap / 100);
        listingPrice = Math.min(basePrice, maxPrice);
      }
      listingPrice = Math.round(listingPrice * 100) / 100; // Round to 2 decimals

      // Determine if listing should be sold (higher chance for past events)
      const shouldBeSold = isPastEvent
        ? Math.random() < 0.8 // 80% sold for past events
        : Math.random() < 0.4; // 40% sold for upcoming events

      const listing = await prisma.listing.create({
        data: {
          eventId: event.id,
          userId: seller.id,
          price: listingPrice,
          status: shouldBeSold ? 'SOLD' : 'ACTIVE',
          createdAt: new Date(event.listingOpenTime.getTime() + Math.random() * (now.getTime() - event.listingOpenTime.getTime())),
        },
      });

      // Create trade if listing is sold
      if (shouldBeSold) {
        const buyer = users[Math.floor(Math.random() * users.length)];
        if (buyer.id !== seller.id) {
          const tradeDaysAfterListing = Math.random() * 5; // Trade happens 0-5 days after listing
          const tradeDate = new Date(listing.createdAt.getTime() + tradeDaysAfterListing * 24 * 60 * 60 * 1000);

          await prisma.trade.create({
            data: {
              listingId: listing.id,
              buyerId: buyer.id,
              sellerId: seller.id,
              price: listingPrice,
              completedAt: tradeDate < now ? tradeDate : now,
            },
          });
        }
      }
    }
  }

  const totalListings = await prisma.listing.count();
  const totalTrades = await prisma.trade.count();

  console.log(`✅ Created ${totalListings} listings`);
  console.log(`✅ Created ${totalTrades} trades`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
