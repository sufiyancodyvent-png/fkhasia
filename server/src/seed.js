import { assertEnv, env } from './config/env.js'
import { connectDb } from './config/db.js'
import { AttendanceSettings } from './models/AttendanceSettings.js'
import { User } from './models/User.js'

async function upsertUser({ email, password, role, name, profile }) {
  if (!password) {
    throw new Error(`Missing seed password for ${email}`)
  }

  const passwordHash = await User.hashPassword(password)

  await User.findOneAndUpdate(
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

  await upsertUser({
    email: env.seedEmployeeEmail,
    password: env.seedEmployeePassword,
    role: 'employee',
    name: 'Employee User',
    profile: { department: 'General', designation: 'Employee' },
  })

  console.log('Seed complete')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
