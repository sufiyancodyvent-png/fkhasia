import { assertEnv, env } from './config/env.js'
import { connectDb } from './config/db.js'
import { AttendanceSettings } from './models/AttendanceSettings.js'
import { User } from './models/User.js'
import { SupportTicket } from './models/SupportTicket.js'

async function upsertUser({ email, password, role, name, profile }) {
  if (!password) {
    throw new Error(`Missing seed password for ${email}`)
  }

  const passwordHash = await User.hashPassword(password)

  return await User.findOneAndUpdate(
    { email },
    {
      name,
      email,
      role,
      status: 'active',
      profile,
      passwordHash,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
}

async function seed() {
  assertEnv()
  await connectDb()

  await AttendanceSettings.findOneAndUpdate(
    {},
    { timezone: env.timezone },
    { upsert: true, setDefaultsOnInsert: true },
  )

  await upsertUser({
    email: env.seedAdminEmail,
    password: env.seedAdminPassword,
    role: 'admin',
    name: 'System Admin',
    profile: { department: 'Administration', designation: 'Owner' },
  })

  const employeeUser = await upsertUser({
    email: env.seedEmployeeEmail,
    password: env.seedEmployeePassword,
    role: 'employee',
    name: 'Employee User',
    profile: { department: 'General', designation: 'Employee' },
  })

  await upsertUser({
    email: 'fkhasia@gmail.com',
    password: process.env.SEED_GATEWAY_PASSWORD || 'fkhasia[]2026',
    role: 'gateway',
    name: 'Gateway User',
    profile: { department: 'Security', designation: 'Gateway Security' },
  })

  await upsertUser({
    email: 'supervisor@fkhasia.com',
    password: 'SupervisorUser@2026!',
    role: 'supervisor',
    name: 'Supervisor User',
    profile: { department: 'General', designation: 'Supervisor' },
  })

  // Seed the 5 agents from the support dashboard screenshot
  const agent1 = await upsertUser({
    email: 'tanner@fkhasia.com',
    password: 'AgentTanner@2026!',
    role: 'employee',
    name: 'Tanner Hodge',
    profile: { department: 'Support Team', designation: 'Support Agent L2' },
  })

  const agent2 = await upsertUser({
    email: 'lynda@fkhasia.com',
    password: 'AgentLynda@2026!',
    role: 'employee',
    name: 'Lynda Shames',
    profile: { department: 'Support Team', designation: 'Support Agent L2' },
  })

  const agent3 = await upsertUser({
    email: 'kai@fkhasia.com',
    password: 'AgentKai@2026!',
    role: 'employee',
    name: 'Kai Gaines',
    profile: { department: 'Support Team', designation: 'Support Agent L1' },
  })

  const agent4 = await upsertUser({
    email: 'sophie@fkhasia.com',
    password: 'AgentSophie@2026!',
    role: 'employee',
    name: 'Sophie Mortimer',
    profile: { department: 'Support Team', designation: 'Support Agent L3' },
  })

  const agent5 = await upsertUser({
    email: 'kenzie@fkhasia.com',
    password: 'AgentKenzie@2026!',
    role: 'employee',
    name: 'Kenzie Fields',
    profile: { department: 'Support Team', designation: 'Support Agent L1' },
  })

  console.log('Clearing old tickets...')
  await SupportTicket.deleteMany({})

  console.log('Generating tickets to match dashboard screenshots...')
  const tickets = []

  // 1. 266 Unassigned tickets
  for (let i = 0; i < 266; i++) {
    tickets.push({
      subject: `Unassigned ticket issue #${i + 1}`,
      status: 'unassigned',
      category: ['Sales enquiry', 'Feature request', 'Setup Request', 'Bug'][i % 4],
      firstContactResolved: false,
    })
  }

  // 2. Open tickets
  // Tanner: 105, Lynda: 64, Kai: 47, Sophie: 47, Kenzie: 46 (Total = 309)
  // Others: 154 (Total open = 463)
  const openDist = [
    { agent: agent1, count: 105 },
    { agent: agent2, count: 64 },
    { agent: agent3, count: 47 },
    { agent: agent4, count: 47 },
    { agent: agent5, count: 46 },
    { agent: employeeUser, count: 154 },
  ]

  openDist.forEach(({ agent, count }) => {
    for (let i = 0; i < count; i++) {
      tickets.push({
        subject: `Open assistance ticket for ${agent.name} #${i + 1}`,
        status: 'open',
        category: ['Sales enquiry', 'Feature request', 'Setup Request', 'Bug'][i % 4],
        assignedTo: agent._id,
        firstContactResolved: false,
      })
    }
  })

  // 3. Solved tickets
  // Tanner: 3993, Lynda: 2133, Kai: 1812, Sophie: 1768, Kenzie: 1715 (Total = 11421)
  // Others: 5579 (Total solved = 17000)
  const solvedDist = [
    { agent: agent1, count: 3993, satisfaction: 80 },
    { agent: agent2, count: 2133, satisfaction: 84 },
    { agent: agent3, count: 1812, satisfaction: 87 },
    { agent: agent4, count: 1768, satisfaction: 92 },
    { agent: agent5, count: 1715, satisfaction: 84 },
    { agent: employeeUser, count: 5579, satisfaction: 83 },
  ]

  let ticketIndex = 0
  solvedDist.forEach(({ agent, count, satisfaction }) => {
    for (let i = 0; i < count; i++) {
      const rand = (ticketIndex + i) % 100
      const category = rand < 40
        ? 'Sales enquiry'
        : rand < 65
          ? 'Feature request'
          : rand < 85
            ? 'Setup Request'
            : 'Bug'

      const fcrThreshold = rand < 40 ? 0.83 : rand < 65 ? 0.78 : rand < 85 ? 0.74 : 0.60

      const fcrRand = (ticketIndex + i * 7) % 100
      const firstContactResolved = fcrRand < (fcrThreshold * 100)

      // Satisfactory ratings (9-10 are promoters, count as satisfied users)
      const ratingRand = (ticketIndex + i * 13) % 100
      const subRand = ratingRand % 100
      const rating = ratingRand < satisfaction
        ? (ratingRand % 2 === 0 ? 10 : 9)
        : subRand < 37.5
          ? (subRand % 2 === 0 ? 8 : 7)
          : 1 + (subRand % 6)

      tickets.push({
        subject: `Resolved query handled by ${agent.name} #${i + 1}`,
        status: 'solved',
        category,
        assignedTo: agent._id,
        firstContactResolved,
        satisfactionRating: rating,
      })
      ticketIndex++
    }
  })

  console.log(`Bulk inserting ${tickets.length} tickets into database...`)
  const batchSize = 4000
  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize)
    await SupportTicket.collection.insertMany(batch)
    console.log(`Inserted batch ${i} to ${Math.min(i + batchSize, tickets.length)}...`)
  }

  console.log('Seed complete')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
