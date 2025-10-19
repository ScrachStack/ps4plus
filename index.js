const fs = require("fs"),
    path = require("path");
const {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    REST,
    Routes,
    Collection
} = require("discord.js");
const config = require("./config");
const {
    token,
    clientId
} = config;

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: Object.values(Partials)
});
client.commands = new Collection();

const commands = fs.readdirSync(path.join(__dirname, "commands"))
    .filter(f => f.endsWith(".js"))
    .map(f => {
        const cmd = require(`./commands/${f}`);
        if (cmd ?.data && cmd ?.execute) {
            client.commands.set(cmd.data.name, cmd);
            return cmd.data.toJSON();
        }
    }).filter(Boolean);

const rest = new REST({
    version: "10"
}).setToken(token);

client.once(Events.ClientReady, () => {
    console.log(`[Sync Studios]: Bot logged in as ${client.user.tag}`);
    console.log("[Sync Studios] PS$+++: Loading ....");
    console.log("[Sync Studios] Support: https://disboard.org/server/join/1119734000974565439");
    console.log("[Sync Studios] Made By ScratchStack");
});

client.on(Events.InteractionCreate, async i => {
    if (!i.isChatInputCommand()) return;
    const cmd = client.commands.get(i.commandName);
    if (!cmd) return i.reply({
        content: "Command not found.",
        ephemeral: true
    });
    try {
        await cmd.execute(i);
    } catch (err) {
        console.error(`[Command Error] ${i.commandName}`, err);
        i.reply({
            content: "There was an error executing this command.",
            ephemeral: true
        });
    }
});

(async () => {
    try {
        await rest.put(Routes.applicationCommands(clientId), {
            body: commands
        });
    } catch (err) {
        console.error("[Command Sync Error]", err);
    }
    await client.login(token);
})();