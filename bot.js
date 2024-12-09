const config = require("./config.json");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { thousandsSeparators } = require('./commonFunctions.js');
const buttonCallbacks = {};

// Catch all errors
process.on('uncaughtException', console.error);

// Initialize Discord.js (Along with the commands)
const client = new Client({ partials: [Partials.Channel], intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// Reads the files in the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

let totalServers;
client.once(Events.ClientReady, async () => {
  // Load and set commands
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);

    // Fetch the command ID and log it alongside the file
    const commands = await client.application.commands.fetch();
    const loadedCommand = commands.find(cmd => cmd.name === command.data.name);
    const commandId = loadedCommand ? loadedCommand.id : 'No ID found';

    console.log(`[Loaded]: ${file} | Command ID: ${commandId}`);
  }
  console.log(`[Bot]: ${client.user.tag}`);
  console.log("[Servers]: " + (await client.shard.fetchClientValues('guilds.cache.size')).reduce((a, b) => a + b, 0));
  let totalServers = await (await fetch('https://api.cornbread2100.com/count')).json();
  client.user.setPresence({ activities: [{ name: `Who?`, type: ActivityType.Watching }] });

  setInterval(async () => {
    totalServers = await (await fetch('https://api.cornbread2100.com/count')).json();
    client.user.setPresence({ activities: [{ name: `Who?`, type: ActivityType.Watching }] });
  }, 60000);
});
// When a chat input command is received, attempt to execute it
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, buttonCallbacks, client, totalServers, (n) => totalServers = n);
    } catch (error) {
      console.log('[Error]:');
      console.log(error);
      var errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .addFields({ name: 'Error', value: error.toString() })
      if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [errorEmbed] })
      else await interaction.reply({ content: '', embeds: [errorEmbed] })
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {}
  } else if (interaction.isButton()) {
    if (buttonCallbacks[interaction.customId]) buttonCallbacks[interaction.customId](interaction);
    else {
      const command = client.commands.get(interaction.customId.split('-')[0]);
      if (command?.buttonHandler) command.buttonHandler(interaction);
    }
    
  }
});

// Log the bot into the Discord API
client.login(config.token);
