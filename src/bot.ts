import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface CustomClient extends Client {
  commands: Collection<string, any>
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
}) as CustomClient

client.commands = new Collection()

// ──────────────────────────────────────
//  Recursively load all command files
// ──────────────────────────────────────
async function loadCommands(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await loadCommands(fullPath)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      try {
        const command = await import(fullPath)
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command)
          console.log(`✅ Loaded command: /${command.data.name}`)
        } else {
          console.warn(`⚠️  Skipping ${fullPath}: missing "data" or "execute"`)
        }
      } catch (err) {
        console.error(`❌ Failed to load ${fullPath}:`, err)
      }
    }
  }
}

const commandsPath = path.join(__dirname, 'commands')
await loadCommands(commandsPath)

console.log(`📦 Loaded ${client.commands.size} commands total`)

// ──────────────────────────────────────
//  Event handlers
// ──────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`🤖 Ready! Logged in as ${c.user.tag}`)
  console.log(`📡 Serving ${c.guilds.cache.size} server(s)`)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)

  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error)
    const errorMsg = '❌ 명령어 실행 중 오류가 발생했습니다!'
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: errorMsg,
        ephemeral: true,
      })
    } else {
      await interaction.reply({
        content: errorMsg,
        ephemeral: true,
      })
    }
  }
})

client.login(process.env.DISCORD_TOKEN)
