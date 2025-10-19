const { Client, Intents, Collection, MessageActionRow, MessageButton, MessageSelectMenu , Modal, TextInputComponent, MessageEmbed} = require('discord.js');
const fs = require('fs');
global.config = require('./config');
const path = require('path');

const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS, 
      Intents.FLAGS.GUILD_MESSAGES,
    ]
  });
  client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    config.guildIds.forEach(guildID => {
        const guild = client.guilds.cache.get(guildID);
        if (guild) {
            console.log(`[Sync Studios]: Commands Loaded In ${guild.name}`);
            console.log("[Sync Studios] PS$+++: Loading ....")
            console.log("[Sync Studios] Support: https://disboard.org/server/join/1119734000974565439")
            console.log("[Sync Studios] Made By ScratchStack")
            guild.commands.set(Array.from(client.commands.values()).map(cmd => cmd.data)).catch(err => {
                console.error(`[Sync Studios]: Failed to set commands for ${guild.name}:`, err);
            });
        } else {
            console.log(`[Sync Studios]: Guild not found: ${guildID}`);
        }
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while executing this command!', ephemeral: true });
    }
});


  
client.login(config.token);
