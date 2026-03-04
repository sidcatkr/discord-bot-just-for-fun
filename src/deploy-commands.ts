import { REST, Routes } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const commands: any[] = []

function loadCommands(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      loadCommands(fullPath)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      // We'll dynamically import below
      commands.push(fullPath)
    }
  }
}

const commandsPath = path.join(__dirname, 'commands')
loadCommands(commandsPath)

async function deploy() {
  const commandData: any[] = []

  for (const filePath of commands) {
    try {
      const command = await import(filePath)
      if ('data' in command) {
        commandData.push(command.data.toJSON())
        console.log(`✅ Prepared: /${command.data.name}`)
      }
    } catch (err) {
      console.error(`❌ Failed to load ${filePath}:`, err)
    }
  }

  const token = process.env.DISCORD_TOKEN!
  const clientId = process.env.CLIENT_ID!
  const guildId = process.env.GUILD_ID // Optional: for guild-specific deploy

  const rest = new REST({ version: '10' }).setToken(token)

  try {
    console.log(`\n� Deploying ${commandData.length} commands...`)

    if (guildId) {
      // Clear all existing guild commands first
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: [],
      })
      console.log(`🗑️ Cleared all existing guild commands`)

      // Deploy new commands
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      })
      console.log(`✅ Successfully deployed to guild ${guildId}!`)
    } else {
      // Clear all existing global commands first
      await rest.put(Routes.applicationCommands(clientId), {
        body: [],
      })
      console.log(`🗑️ Cleared all existing global commands`)

      // Deploy new commands
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      })
      console.log(`✅ Successfully deployed globally! (may take up to 1h)`)
    }

    console.log('\n📜 Deployed commands:')
    commandData.forEach((cmd) =>
      console.log(`  /${cmd.name} — ${cmd.description}`),
    )
  } catch (error) {
    console.error('❌ Deploy failed:', error)
  }
}

deploy()
