const {
    SlashCommandBuilder
} = require("discord.js");
const http = require("http"),
    https = require("https"),
    {
        URL
    } = require("url");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("postbin")
        .setDescription("Send a .bin payload to a PS4 GoldHEN target")
        .addStringOption(o => o.setName("ip").setDescription("Target IP").setRequired(true))
        .addAttachmentOption(o => o.setName("file").setDescription(".bin payload").setRequired(true))
        .addIntegerOption(o => o.setName("port").setDescription("Port (default: 9090)").setRequired(false)),

    async execute(i) {
        await i.deferReply();
        const ip = i.options.getString("ip"),
            port = i.options.getInteger("port") || 9090;
        const a = i.options.getAttachment("file");
        if (!a.name ?.toLowerCase().endsWith(".bin")) return i.editReply("Attach a `.bin` file.");

        const url = `http://${ip}:${port}/upload`;
        try {
            await i.editReply(`Downloading **${a.name}** (${a.size} bytes)...`);
            const buf = await new Promise((res, rej) => {
                (a.url.startsWith("https://") ? https : http).get(a.url, r => {
                    if (r.statusCode !== 200) return rej(new Error(`Download failed: ${r.statusCode}`));
                    const chunks = [];
                    r.on("data", c => chunks.push(c));
                    r.on("end", () => res(Buffer.concat(chunks)));
                    r.on("error", rej);
                }).on("error", rej);
            });

            await i.editReply(`Posting **${a.name}** (${buf.length} bytes) to \`${url}\`...`);
            const res = await new Promise((res, rej) => {
                let u;
                try {
                    u = new URL(url);
                } catch {
                    return rej(new Error("Invalid URL"));
                }
                const opts = {
                    method: "POST",
                    hostname: u.hostname,
                    port: u.port,
                    path: u.pathname + u.search,
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": buf.length,
                        "User-Agent": "discord-bot-postbin/1.0"
                    },
                    timeout: 7000
                };
                const req = (u.protocol === "https:" ? https : http).request(opts, r => {
                    const chunks = [];
                    r.on("data", c => chunks.push(c));
                    r.on("end", () => res({
                        statusCode: r.statusCode,
                        body: Buffer.concat(chunks).toString("utf8")
                    }));
                });
                req.on("error", rej);
                req.on("timeout", () => req.destroy(new Error("Timeout")));
                req.write(buf);
                req.end();
            });

            const preview = (res.body || "").slice(0, 1000);
            await i.editReply(`POST complete — status ${res.statusCode}.\nResponse:\n\`\`\`\n${preview}\n\`\`\``);
        } catch (err) {
            console.error("[postbin] error:", err);
            await i.editReply(`Failed: ${err?.message || String(err)}`);
        }
    }
};