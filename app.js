const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    AuditLogEvent,
    PermissionsBitField
} = require("discord.js");
const {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState
} = require("@discordjs/voice");
const http = require("http");
const fs = require("fs");

// Config Store
const CONFIG_FILE = "./bot_settings.json";
let settings = {
    welcomeChannelId: null,
    byebyeChannelId: null,
    vcId: null,
    guildId: null
};

if (fs.existsSync(CONFIG_FILE)) {
    try {
        settings = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    } catch (e) {
        console.error("Config read error:", e);
    }
}

function saveSettings() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2));
}

// Bot Credentials
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const BANNER_URL = "https://raw.githubusercontent.com/yogesh28-dev/vaelkry/main/banner.png";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// Audit Logger Helper
async function sendAudit(guild, channelKey, embed) {
    try {
        const targetChannel = guild.channels.cache.find(c => c.name.toLowerCase().includes(channelKey.toLowerCase()));
        if (targetChannel && targetChannel.isTextBased()) {
            await targetChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error(`Audit dispatch failure [${channelKey}]:`, err.message);
    }
}

// 24/7 Voice Engine
async function connectVoice(channel) {
    if (!channel) return;
    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
                ]);
            } catch {
                connection.destroy();
                setTimeout(() => connectVoice(channel), 5000);
            }
        });
    } catch (err) {
        console.error("VC Connection Exception:", err.message);
        setTimeout(() => connectVoice(channel), 5000);
    }
}

// Client Ready
client.once("ready", async () => {
    console.log(`🤖 Bot online: ${client.user.tag}`);

    if (settings.guildId && settings.vcId) {
        const guild = client.guilds.cache.get(settings.guildId);
        if (guild) {
            const vc = guild.channels.cache.get(settings.vcId);
            if (vc) connectVoice(vc);
        }
    }
});

// Welcome System
client.on("guildMemberAdd", async (member) => {
    if (!settings.welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
    if (!channel) return;

    const count = member.guild.memberCount;
    const welcomeEmbed = new EmbedBuilder()
        .setColor("#111214")
        .setAuthor({
            name: "◟ V Λ Σ L K Я Y ◞",
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTitle(`Welcome to V Λ Σ L K Я Y — ${member.user.tag}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `*Your destination for premium digital solutions.*\n\n` +
            `Explore our ecosystem of **Discord Services, Custom Bots, Automation, Optimization, Creative Services & Digital Resources.**\n\n` +
            `⇋ **GET STARTED** ⇌\n\n` +
            `↠ Read our guidelines ➔ <#rules>\n` +
            `↠ Explore our services ➔ <#store>\n` +
            `↠ Access free resources ➔ <#free-zone>\n` +
            `↠ Need assistance? ➔ <#support>\n` +
            `↠ Stay updated ➔ <#announcement>\n\n` +
            `📌 **Server Invite Link**\n\n` +
            `**BUILD • AUTOMATE • OPTIMIZE • CREATE**\n\n` +
            `*Thank you for choosing V Λ Σ L K Я Y.*`
        )
        .setImage(BANNER_URL)
        .setFooter({
            text: `Member #${count} • V Λ Σ L K Я Y Ecosystem`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

    await channel.send({
        content: `Hey <@${member.id}>, welcome to **V Λ Σ L K Я I Σ S**!`,
        embeds: [welcomeEmbed]
    });
});

// Byebye System
client.on("guildMemberRemove", async (member) => {
    if (!settings.byebyeChannelId) return;
    const channel = member.guild.channels.cache.get(settings.byebyeChannelId);
    if (!channel) return;

    const count = member.guild.memberCount;
    const byeEmbed = new EmbedBuilder()
        .setColor("#111214")
        .setAuthor({
            name: "◟ V Λ Σ L K Я Y ◞",
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTitle(`◟ THANK YOU FOR VISITING V Λ Σ L K Я Y ◞`)
        .setThumbnail("https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png")
        .setDescription(
            `Farewell **${member.user.username}** — *your journey with us may pause here, but our doors are always open.*\n\n` +
            `We appreciate your presence and support within the ecosystem. Stay connected with our network for future services, digital resources, and corporate updates.\n\n` +
            `«✦ **Keep creating. Keep building. Keep evolving.** ✦»\n\n` +
            `**BUILD • AUTOMATE • OPTIMIZE • CREATE**\n\n` +
            `*Thank you for being part of V Λ Σ L K Я Y.*`
        )
        .setImage(BANNER_URL)
        .setFooter({
            text: `Remaining Members: ${count} • V Λ Σ L K Я Y Departure Log`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

    await channel.send({ embeds: [byeEmbed] });
});

// Commands Engine
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    // Auto-Moderation (Invite / Phishing links)
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
        const scamRegex = /(nitro|free-nitro|steamgift|airdrop).*(discord\.gg|gift|claim)/i;

        if (inviteRegex.test(message.content) || scamRegex.test(message.content)) {
            await message.delete().catch(() => { });
            const warnMsg = await message.channel.send(`⚠️ ${message.author}, unauthorized invite/malicious links are prohibited.`);
            setTimeout(() => warnMsg.delete().catch(() => { }), 4000);

            const modLog = new EmbedBuilder()
                .setColor("#ff4b4b")
                .setTitle("🛡️ Auto-Moderation Triggered")
                .addFields(
                    { name: "Target", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
                    { name: "Reason", value: "Suspicious Link / Invite Post", inline: false },
                    { name: "Message Content", value: `\`\`\`${message.content.slice(0, 500)}\`\`\``, inline: false }
                )
                .setTimestamp();
            sendAudit(message.guild, "member-actions-mode", modLog);
            return;
        }
    }

    const prefix = "()? ";
    const altPrefix = "()?";
    let content = message.content;
    if (!content.startsWith(prefix) && !content.startsWith(altPrefix)) return;

    const usedPrefix = content.startsWith(prefix) ? prefix : altPrefix;
    const args = content.slice(usedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ()?vcjoin
    if (command === "vcjoin") {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply("❌ Mudhala oru voice channel-la join pannunga!");
        }
        settings.vcId = voiceChannel.id;
        settings.guildId = message.guild.id;
        saveSettings();
        connectVoice(voiceChannel);
        return message.reply(`🔒 Bound & connected 24/7 to **${voiceChannel.name}**.`);
    }

    // ()?vcleave
    if (command === "vcleave") {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            settings.vcId = null;
            saveSettings();
            return message.reply("🔌 Disconnected from voice channel.");
        } else {
            return message.reply("❌ The bot is not in any voice channel.");
        }
    }

    // ()?welcomeactivate
    if (command === "welcomeactivate") {
        settings.welcomeChannelId = message.channel.id;
        saveSettings();
        return message.reply(`✅ Welcome messages activated for <#${message.channel.id}>.`);
    }

    // ()?byebyeactivate
    if (command === "byebyeactivate") {
        settings.byebyeChannelId = message.channel.id;
        saveSettings();
        return message.reply(`✅ Departure/Goodbye messages activated for <#${message.channel.id}>.`);
    }
});

// Audit Logs Listeners
client.on("guildAuditLogEntryCreate", async (entry, guild) => {
    const { action, executorId, targetId, reason } = entry;
    const mod = executorId ? `<@${executorId}>` : "System";

    if (action === AuditLogEvent.MemberKick || action === AuditLogEvent.MemberBanAdd) {
        const embed = new EmbedBuilder()
            .setColor("#ff3333")
            .setTitle(action === AuditLogEvent.MemberKick ? "👢 Member Kicked" : "🔨 Member Banned")
            .addFields(
                { name: "Target", value: `<@${targetId}> (\`${targetId}\`)`, inline: true },
                { name: "Moderator", value: mod, inline: true },
                { name: "Reason", value: reason || "None provided", inline: false }
            )
            .setTimestamp();
        sendAudit(guild, "member-actions-mode", embed);
    }
});

client.on("channelCreate", async (channel) => {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
        .setColor("#00ff88")
        .setTitle("📁 Channel Created")
        .addFields(
            { name: "Name", value: channel.name, inline: true },
            { name: "Type", value: `${channel.type}`, inline: true }
        )
        .setTimestamp();
    sendAudit(channel.guild, "channel-category-changes", embed);
});

client.on("channelDelete", async (channel) => {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
        .setColor("#ff0044")
        .setTitle("📁 Channel Deleted")
        .addFields({ name: "Name", value: channel.name, inline: true })
        .setTimestamp();
    sendAudit(channel.guild, "channel-category-changes", embed);
});

client.on("roleCreate", async (role) => {
    const embed = new EmbedBuilder()
        .setColor("#3399ff")
        .setTitle("🛡️ Role Created")
        .addFields({ name: "Role", value: `${role.name} (\`${role.id}\`)`, inline: true })
        .setTimestamp();
    sendAudit(role.guild, "roles-permissions", embed);
});

client.on("roleDelete", async (role) => {
    const embed = new EmbedBuilder()
        .setColor("#ff5500")
        .setTitle("🗑️ Role Deleted")
        .addFields({ name: "Role Name", value: role.name, inline: true })
        .setTimestamp();
    sendAudit(role.guild, "roles-permissions", embed);
});

client.on("messageDelete", async (message) => {
    if (!message.guild || message.author?.bot) return;
    const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("🗑️ Message Deleted")
        .addFields(
            { name: "Author", value: message.author ? `${message.author.tag}` : "Unknown", inline: true },
            { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
            { name: "Content", value: message.content ? `\`\`\`${message.content.slice(0, 800)}\`\`\`` : "*No text / media only*", inline: false }
        )
        .setTimestamp();
    sendAudit(message.guild, "messages-threads", embed);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    if (!guild || member?.user?.bot) return;

    if (!oldState.channelId && newState.channelId) {
        const embed = new EmbedBuilder()
            .setColor("#2ecc71")
            .setTitle("🔊 Voice Joined")
            .addFields(
                { name: "User", value: `${member.user.tag}`, inline: true },
                { name: "Channel", value: `<#${newState.channelId}>`, inline: true }
            )
            .setTimestamp();
        sendAudit(guild, "activity-alerts", embed);
    } else if (oldState.channelId && !newState.channelId) {
        const embed = new EmbedBuilder()
            .setColor("#95a5a6")
            .setTitle("🔇 Voice Left")
            .addFields(
                { name: "User", value: `${member.user.tag}`, inline: true },
                { name: "Channel", value: `<#${oldState.channelId}>`, inline: true }
            )
            .setTimestamp();
        sendAudit(guild, "activity-alerts", embed);
    }
});

// Keep-Alive HTTP
http.createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("V Λ Σ L K Я Y Bot Online");
}).listen(10000, () => {
    console.log("Keep-Alive server active on port 10000");
});

client.login(BOT_TOKEN).catch(e => console.error("Gateway Connect Error:", e.message));