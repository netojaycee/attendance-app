import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";
import { generateSlug } from "@/lib/utils";

const adapter = new PrismaPg({
  connectionString:
    "postgres://faf5fc1a4a390ff15ac657b57aaafae7cc923475a0b3b5ec0c10209cb5738f44:sk_84One1_Q_LwScdk9db-oO@db.prisma.io:5432/postgres?sslmode=require",
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.attendance.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.district.deleteMany({});

  // Create districts
  const district1 = await prisma.district.create({
    data: {
      name: "Main District",
    },
  });

  const district2 = await prisma.district.create({
    data: {
      name: "North District",
    },
  });

  console.log(`✓ Created ${district1.name} and ${district2.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      role: "ADMIN",
      voicePart: "SOPRANO",
      districtId: district1.id,
    },
  });

  console.log(`✓ Created admin user: ${adminUser.email}`);

  // Create district leader
  const districtLeader = await prisma.user.create({
    data: {
      email: "leader@example.com",
      firstName: "District",
      lastName: "Leader",
      password: await bcrypt.hash("Leader123!", 10),
      role: "DISTRICT_LEADER",
      voicePart: "ALTO",
      districtId: district1.id,
    },
  });

  console.log(`✓ Created district leader: ${districtLeader.email}`);

  // Create part leader
  const partLeader = await prisma.user.create({
    data: {
      email: "part-leader@example.com",
      firstName: "Part",
      lastName: "Leader",
      password: await bcrypt.hash("PartLeader123!", 10),
      role: "PART_LEADER",
      voicePart: "TENOR",
      districtId: district1.id,
    },
  });

  console.log(`✓ Created part leader: ${partLeader.email}`);

  // Create regular members
  const members = [
    {
      firstName: "John",
      lastName: "Soprano",
      email: "john.soprano@example.com",
      voicePart: "SOPRANO",
    },
    {
      firstName: "Jane",
      lastName: "Alto",
      email: "jane.alto@example.com",
      voicePart: "ALTO",
    },
    {
      firstName: "Mike",
      lastName: "Tenor",
      email: "mike.tenor@example.com",
      voicePart: "TENOR",
    },
    {
      firstName: "Bob",
      lastName: "Bass",
      email: "bob.bass@example.com",
      voicePart: "BASS",
    },
    {
      firstName: "Sarah",
      lastName: "Soprano",
      email: "sarah.soprano@example.com",
      voicePart: "SOPRANO",
    },
    {
      firstName: "Emily",
      lastName: "Alto",
      email: "emily.alto@example.com",
      voicePart: "ALTO",
    },
  ];

  const createdMembers = [];
  for (const member of members) {
    const user = await prisma.user.create({
      data: {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        password: await bcrypt.hash("Member123!", 10),
        role: "MEMBER",
        voicePart: member.voicePart as any,
        districtId: district1.id,
      },
    });
    createdMembers.push(user);
  }

  console.log(`✓ Created ${members.length} choir members`);

  // Create an event
  const now = new Date();
  const event = await prisma.event.create({
    data: {
      title: "Spring Rehearsal",
      description: "Practicing spring concert pieces",
      type: "SINGLE_DISTRICT",
      startDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      districtId: district1.id,
      creatorId: adminUser.id,
      slug: generateSlug("Spring Rehearsal"),
      passMark: 75,
    },
  });

  console.log(`✓ Created event: ${event.title}`);

  // Create sessions for the event
  await prisma.session.create({
    data: {
      eventId: event.id,
      date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(
        now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
      durationMinutes: 120,
      districtId: district1.id,
      createdById: adminUser.id,
    },
  });

  await prisma.session.create({
    data: {
      eventId: event.id,
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
      durationMinutes: 120,
      districtId: district1.id,
      createdById: adminUser.id,
    },
  });

  console.log(`✓ Created 2 sessions for the event`);

  // Create some attendance records
  // const allUsers = [adminUser, districtLeader, partLeader, ...createdMembers];

  // for (const session of [session1, session2]) {
  //   for (let i = 0; i < Math.min(5, allUsers.length); i++) {
  //     const user = allUsers[i];
  //     const minutesLate = i === 1 ? 10 : i === 2 ? 5 : 0;
  //     const arrivalTime = new Date(session.startTime.getTime() + minutesLate * 60 * 1000);

  // Calculate percentage: 100% if on time, -5% per 5 minutes late
  // const percentageScore = Math.max(0, 100 - Math.ceil(minutesLate / 5) * 5);

  // await prisma.attendance.create({
  //   data: {
  //     userId: user.id,
  //     sessionId: session.id,
  //     arrivalTime,
  //     percentageScore,
  //     createdById: adminUser.id,
  //   },
  // });
  //   }
  // }

  // console.log(`✓ Created attendance records`);

  console.log("\n✨ Database seeded successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("  Admin: admin@example.com / Admin123!");
  console.log("  District Leader: leader@example.com / Leader123!");
  console.log("  Part Leader: part-leader@example.com / PartLeader123!");
  console.log("  Member: john.soprano@example.com / Member123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
