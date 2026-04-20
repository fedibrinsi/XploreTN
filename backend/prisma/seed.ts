import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create a CITOYEN user to own the activities ────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const curator = await prisma.user.upsert({
    where: { email: "malek@xploretn.com" },
    update: {},
    create: {
      email: "malek@xploretn.com",
      password: hashedPassword,
      fullName: "Malek Ben Achour",
      role: "CITOYEN",
      image: "/uploads/profile/profile.jpg",
      bio: "Local historian and photographer with 20 years of experience documenting Tunisian architecture.",
    },
  });

  const curator2 = await prisma.user.upsert({
    where: { email: "selima@xploretn.com" },
    update: {},
    create: {
      email: "selima@xploretn.com",
      password: hashedPassword,
      fullName: "Selima Bouziane",
      role: "CITOYEN",
      image: "/uploads/profile/profile.jpg",
      bio: "Textile historian specializing in traditional Tunisian weaving and the language of symbols.",
    },
  });

  const curator3 = await prisma.user.upsert({
    where: { email: "ahmed@xploretn.com" },
    update: {},
    create: {
      email: "ahmed@xploretn.com",
      password: hashedPassword,
      fullName: "Ahmed Mansouri",
      role: "CITOYEN",
      image: "/uploads/profile/profile.jpg",
      bio: "Desert guide and storyteller. The stars in the Sahara tell stories that haven't changed since the Berbers first named them.",
    },
  });

  console.log(
    `✅ Created curators: ${curator.fullName}, ${curator2.fullName}, ${curator3.fullName}`,
  );

  // ─── Seed activities ────────────────────────────────────────────────────
  // From ExploreActivities.tsx + CuratorDashboard.tsx + HomePage.tsx (Curated Portals)
  const activities = [
    // --- From ExploreActivities ---
    {
      title: "The Blue Alchemy: Sidi Bou Said Photography Walk",
      description:
        "Capture the ethereal light of the 'Blue City' with a professional editorial photographer. Discover hidden courtyards and private jasmine gardens. This curated walk is more than a tour; it's an immersion into the poetic soul of Tunisia's most iconic coastal village.",
      price: 85,
      date: new Date("2026-06-15T09:00:00Z"),
      location: "Sidi Bou Said, Tunis",
      latitude: 36.8687,
      longitude: 10.3497,
      images: [
        "https://www.bigworldsmallpockets.com/wp-content/uploads/2023/07/Tunisia-Sidi-Bou-Said-Me-in-Doorway.jpg",
        "https://olovetunisia.com/cdn/shop/articles/sidi_bous_said_tunisia_1600x.jpg?v=1665796742",
      ],
      capacity: 6,
      category: "ART_HERITAGE" as const,
      creatorId: curator.id,
    },
    {
      title: "The Medina Kitchen: A Private Masterclass",
      description:
        "Join Mouna in her family's 17th-century home to learn the secrets of perfect Couscous and Harissa from scratch. Experience the rich fragrances and flavors that define Tunisian cuisine in an intimate, hands-on cooking session.",
      price: 60,
      date: new Date("2026-06-20T10:00:00Z"),
      location: "Medina of Tunis",
      latitude: 36.7986,
      longitude: 10.1712,
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCtvdYzjk1Q-4egoSFds74k9wxwp1M8TGCSWEK3bdr38NjC-HMya5PjacHG6drLr1dzk0tjQ3f45PFOuGFpvpUaEAWylGuKoj-bnF7DBnVwlpN3OVtd0In1Qnw1Wf_73P1fXzse_vzp8OpOixU6lkBq3F8XJg3edtd7OCOzaY27g8TQXJbtpfQsKgSNjkMIQipifT355LHvTffQ0SZEGLPkkXdc46COpggzbg8ubapIs8du3YtjdUp0oHPvKZbc8ShFAlpYeAeN7u0",
      ],
      capacity: 8,
      category: "GASTRONOMY" as const,
      creatorId: curator.id,
    },
    {
      title: "Gladiators and Grain: The El Jem Expedition",
      description:
        "A deep dive into Roman Africa. Explore the third-largest amphitheatre in the world with an archaeology expert, followed by an olive oil tasting in a nearby organic grove. Includes transport, lunch, and an expert guide.",
      price: 120,
      date: new Date("2026-07-01T07:00:00Z"),
      location: "El Jem, Mahdia",
      latitude: 35.2961,
      longitude: 10.7076,
      images: [
        "https://i0.wp.com/unusualplaces.org/wp-content/uploads/2023/04/Depositphotos_323674984_S-jpg.webp?ssl=1",
      ],
      capacity: 12,
      category: "HISTORICAL_TOUR" as const,
      creatorId: curator.id,
    },

    // --- From CuratorDashboard ---
    {
      title: "Carthage Tile Painting",
      description:
        "Master the art of traditional Carthaginian zellige tile painting in a hands-on workshop. Learn the intricate geometric patterns that have adorned Tunisian palaces for centuries under the guidance of a master artisan.",
      price: 45,
      date: new Date("2026-06-10T14:00:00Z"),
      location: "Sidi Bou Said, Tunis",
      latitude: 36.8687,
      longitude: 10.3497,
      images: [
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzMOpufliR8N0bGxLmULbVuM9_UWJETbP3Zg&s",
      ],
      capacity: 10,
      category: "ARTISAN_WORKSHOP" as const,
      creatorId: curator2.id,
    },
    {
      title: "Medina Secret Flavors",
      description:
        "An immersive full-day culinary journey through the winding alleys of the Medina. Visit hidden spice shops, meet family food artisans, and taste street food that guidebooks don't mention. End the day cooking in a riad courtyard.",
      price: 120,
      date: new Date("2026-06-25T08:00:00Z"),
      location: "Medina Old City, Tunis",
      latitude: 36.7986,
      longitude: 10.1712,
      images: [
        "https://img.freepik.com/premium-photo/historic-zitouna-mosque-tunisian-heritage-medina-tunis_770311-1182.jpg",
      ],
      capacity: 8,
      category: "GASTRONOMY" as const,
      creatorId: curator2.id,
    },
    {
      title: "Sahara Stargazing",
      description:
        "Experience the cosmic silence of the Sahara Desert under a blanket of infinite stars. This overnight expedition includes camel trekking, a Berber campsite dinner, and astronomy storytelling by a local guide.",
      price: 250,
      date: new Date("2026-08-15T16:00:00Z"),
      location: "Douz, Sahara Desert",
      latitude: 33.4614,
      longitude: 8.9837,
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDkMf_x3imcg4v2XUOPNJ3J06yGFrIXd54T2pYM-UINGoYaI2MmhPIACi7-VUzRl4GBwknb9xoB0ozB1V_2gdnB60HNwjokAq4oQ2NgA8H65B1Jzh99Kh2I9Qg5MvStr7Hf7LSDip17RbV-SIPlkx-lNOlbWh7L05_NlzTqIkWd5vneWfWZVqRDdk3iZNbTGKm5iTBs_4oqp_dfyTXpOWbhxeS4QDuK1JzjJ4U-34zNTOe3niGLXJMeSroLZ4xuD8I6C78iq2Jlyw0",
      ],
      capacity: 6,
      category: "DESERT_EXPEDITION" as const,
      creatorId: curator3.id,
    },

    // --- From HomePage Curated Portals ---
    {
      title: "Artisanal Pottery Workshop",
      description:
        "Master the ancient art of Tunisian pottery in a traditional workshop. Learn to shape, glaze, and paint ceramics using techniques passed down for centuries. Take your handcrafted piece home as a timeless souvenir.",
      price: 55,
      date: new Date("2026-07-05T10:00:00Z"),
      location: "Nabeul, Cap Bon",
      latitude: 36.4513,
      longitude: 10.7356,
      images: [
        "https://www.figsandjasmine.com/cdn/shop/articles/Tunisian_Ceramic_Blog-3.jpg?v=1702514603&width=1920",
      ],
      capacity: 8,
      category: "ARTISAN_WORKSHOP" as const,
      creatorId: curator2.id,
    },
    {
      title: "Heritage Riad Overnight Experience",
      description:
        "Sleep within the walls of history in a beautifully restored 18th-century riad. Enjoy a traditional evening of storytelling, mint tea, and music performed live by local musicians in the courtyard.",
      price: 180,
      date: new Date("2026-07-10T15:00:00Z"),
      location: "Sidi Bou Said, Tunis",
      latitude: 36.8687,
      longitude: 10.3497,
      images: [
        "https://www.notesfromtheroad.com/files/sidi-bou-said-street.webp",
      ],
      capacity: 4,
      category: "CULTURAL_EVENT" as const,
      creatorId: curator.id,
    },
    {
      title: "Secret Spice Route: La Goulette Market",
      description:
        "Discover the aromatic world of Tunisian spices on a guided tour of La Goulette's vibrant fish and spice markets. Taste rare blends, meet seasoned merchants, and learn to create your own harissa.",
      price: 40,
      date: new Date("2026-06-28T08:30:00Z"),
      location: "La Goulette, Tunis",
      latitude: 36.8183,
      longitude: 10.3054,
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAf3cEL_W_2KcjsRK-bRxvs9FgGHNRYxXEuyNOXVok5IUlnHpJ0lP7SqEmpwZC7szLFw1p2Whb3V9zCce2hmZX_fkg7maRLhK1uurHMA6TUCnhJ_lXo97EE_TclofQXCstFWqDGSH1wN5Lgb90zDXZhE6FND-AvMBDRrUjHqWlGjVIQY57iz3-EpHc2oetxJ89b5OplH-tqDgl0gcmtNKF2hsf4ldCeoKFV4sFhF9e7shy8NzF9c3HIxpaGMxEQ8Z-r-fMRXjoBL9A",
      ],
      capacity: 10,
      category: "GASTRONOMY" as const,
      creatorId: curator3.id,
    },
    {
      title: "Saharan Dune Expedition",
      description:
        "Navigate the golden silence of the Sahara on a full-day desert expedition. Journey through towering sand dunes by 4x4 and camelback, visit an ancient Berber village, and enjoy a sunset feast under the stars.",
      price: 200,
      date: new Date("2026-08-20T06:00:00Z"),
      location: "Tozeur, Sahara",
      latitude: 33.9197,
      longitude: 8.1336,
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCwgf9Lh-j_Cval-WlNx-04AKpLwJpLuEsJ0MhsauFfZv0WJ1Y3EU59z239av_kWCOk30Jct9jEu60fvmXHU_5Bha5tUhW7lcqxHuY8CjbeSh-kW8YRrl46vgkkm2k6ixxWcq45xvpx2xr8FsAuKKBFVuEwQxzZXJcmoxgE6YYKJxOCKrHRNmagImZSar59lu9g90QE9fobBnn-yv_tPYOGO9VKNivzu9KaF0s0qizyPr7gQiUCUQ22h8DWRU-nmBoHJioEwa3AHjw",
      ],
      capacity: 8,
      category: "DESERT_EXPEDITION" as const,
      creatorId: curator3.id,
    },
    {
      title: "Coastal Fishing Village Experience",
      description:
        "Spend a morning with local fishermen in a charming coastal village. Learn traditional Mediterranean net-casting techniques, help haul in the day's catch, then cook your harvest seaside with a local chef.",
      price: 75,
      date: new Date("2026-07-15T06:00:00Z"),
      location: "Kelibia, Cap Bon",
      latitude: 36.8463,
      longitude: 11.0999,
      images: [
        "https://wildyness.com/uploads/0000/145/2023/07/31/carthage-guide-complete.png",
      ],
      capacity: 6,
      category: "COASTAL_ESCAPE" as const,
      creatorId: curator.id,
    },
    // {
    //   title: "Indigo & Silk Masterclass",
    //   description:
    //     "Learn the ancient art of natural dyeing with indigo and silk weaving from a master textile historian. Create your own piece using techniques and patterns that have been passed down for three generations.",
    //   price: 90,
    //   date: new Date("2026-07-20T09:00:00Z"),
    //   location: "Kairouan",
    //   latitude: 35.6781,
    //   longitude: 10.0963,
    //   images: [
    //     "https://d34ad2g4hirisc.cloudfront.net/location_photos/files/000/250/391/main/3149c73ff81a33c8fd996614134643c0.jpg",
    //   ],
    //   capacity: 5,
    //   category: "ARTISAN_WORKSHOP" as const,
    //   creatorId: curator2.id,
    // },
  ];

  // Upsert activities based on title to avoid duplicates on re-seed
  for (const activity of activities) {
    const existing = await prisma.activity.findFirst({
      where: { title: activity.title },
    });

    if (!existing) {
      await prisma.activity.create({ data: activity });
      console.log(`  ✅ Created: ${activity.title}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${activity.title}`);
    }
  }

  console.log(
    `\n🎉 Seeding complete! ${activities.length} activities processed.`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
