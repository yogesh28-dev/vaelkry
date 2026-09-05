import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    EmbedBuilder,
    AuditLogEvent,
    PermissionFlagsBits
} from "discord.js";
import {
    joinVoiceChannel,
    VoiceConnectionStatus,
    entersState
} from "@discordjs/voice";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express Keep-Alive Server for Railway
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("V Λ Σ L K Я Y Bot is Active 24/7."));
app.listen(PORT, () => console.log(`Keep-Alive server active on port ${PORT}`));

// Persistent Config File
const CONFIG_FILE = path.join(__dirname, "bot_settings.json");
let settings = {
    welcomeChannelId: null,
    byeChannelId: null,
    voiceChannelId: null,
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

// Bot Credentials & Assets
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const BANNER_URI = "https://raw.githubusercontent.com/yogesh28-dev/vaelkry/main/banner.png";

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

// Audit Channel Mapping
const AUDIT_CHANNELS = {
    MEMBER_ACTIONS: "member-actions-mode",
    CHANNEL_CHANGES: "channel-category-changes",
    ROLES_PERMISSIONS: "roles-permissions",
    MESSAGES_THREADS: "messages-threads",
    ACTIVITY_ALERTS: "activity-alerts",
    VOICE_LOGS: "voice-logs",
    SERVER_EVENTS: "server-events"
};

function getLogChannel(guild, name) {
    return guild.channels.cache.find(c => c.name === name);
}

// 24/7 Voice Channel Connection Function
async function connectToVoice(channel) {
    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                connection.destroy();
                setTimeout(() => connectToVoice(channel), 5000);
            }
        });

        return connection;
    } catch (err) {
        console.error("Voice connection error:", err);
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`🤖 Bot online: ${c.user.tag}`);

    // Auto-reconnect to 24/7 Voice Channel on restart
    if (settings.guildId && settings.voiceChannelId) {
        const guild = client.guilds.cache.get(settings.guildId);
        if (guild) {
            const voiceChannel = guild.channels.cache.get(settings.voiceChannelId);
            if (voiceChannel) {
                await connectToVoice(voiceChannel);
                console.log(`🔊 Reconnected to 24/7 Voice: ${voiceChannel.name}`);
            }
        }
    }
});

// Welcome Member Event
client.on(Events.GuildMemberAdd, async (member) => {
    if (settings.welcomeChannelId) {
        const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
        if (channel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setAuthor({
                    name: "⸜  V Λ Σ L K Я Y  ⸝",
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTitle(`Welcome to V Λ Σ L K Я Y — ${member.user.username}`)
                .setDescription(
                    `*Your destination for premium digital solutions.*\n\n` +
                    `Explore our ecosystem of Discord Services, Custom Bots, Automation, Optimization, Creative Services & Digital Resources.\n\n` +
                    `**⇆ GET STARTED ⇆**\n\n` +
                    `⤀ Read our guidelines → <#1542886572221792286>\n` +
                    `⤀ Explore our services → <#1542887034178506873>\n` +
                    `⤀ Access free resources → <#1542886768364355704>\n` +
                    `⤀ Need assistance? → <#1543198370561130596>\n` +
                    `⤀ Stay updated → <#1543198631878856744>\n\n` +
                    `📌 **Server Invite Link**\n\n` +
                    `**BUILD • AUTOMATE • OPTIMIZE • CREATE**\n\n` +
                    `*Thank you for choosing V Λ Σ L K Я Y.*`
                )
                .setImage(BANNER_URI)
                .setFooter({
                    text: `Member #${member.guild.memberCount} • V Λ Σ L K Я Y Ecosystem`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({
                content: `Hey <@${member.id}>, welcome to **V Λ Σ L K Я I Σ S**!`,
                embeds: [welcomeEmbed]
            });
        }
    }

    const logCh = getLogChannel(member.guild, AUDIT_CHANNELS.MEMBER_ACTIONS);
    if (logCh) {
        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle("📥 Member Joined")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`<@${member.id}> (${member.user.tag}) joined the server.\nAccount Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .setTimestamp();
        logCh.send({ embeds: [embed] });
    }
});

// Goodbye Member Event
client.on(Events.GuildMemberRemove, async (member) => {
    if (settings.byeChannelId) {
        const channel = member.guild.channels.cache.get(settings.byeChannelId);
        if (channel) {
            const byeEmbed = new EmbedBuilder()
                .setColor("#000000")
                .setAuthor({
                    name: "⸜  V Λ Σ L K Я Y  ⸝",
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTitle(`Farewell — ${member.user.username}`)
                .setDescription(`We are sad to see you leave **V Λ Σ L K Я I Σ S**. We hope to see you again soon!`)
                .setImage(BANNER_URI)
                .setFooter({
                    text: `Remaining Members: ${member.guild.memberCount} • V Λ Σ L K Я Y Ecosystem`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({ embeds: [byeEmbed] });
        }
    }

    const logCh = getLogChannel(member.guild, AUDIT_CHANNELS.MEMBER_ACTIONS);
    if (logCh) {
        const embed = new EmbedBuilder()
            .setColor("#ed4245")
            .setTitle("📤 Member Left")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`<@${member.id}> (${member.user.tag}) left the server.`)
            .setTimestamp();
        logCh.send({ embeds: [embed] });
    }
});

// Message Commands Handler
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();

    if (content === "()?welcomeactivate") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        settings.welcomeChannelId = message.channel.id;
        saveSettings();
        await message.reply(`✅ Welcome messages activated for <#${message.channel.id}>.`);
    }

    if (content === "()?byebyeactivate") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        settings.byeChannelId = message.channel.id;
        saveSettings();
        await message.reply(`✅ ByeBye messages activated for <#${message.channel.id}>.`);
    }

    if (content === "()?vcjoin") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply("❌ Neenga modhalla oru voice channel-kulla connect aagi irukkanum!");
        }

        settings.guildId = message.guild.id;
        settings.voiceChannelId = voiceChannel.id;
        saveSettings();

        await connectToVoice(voiceChannel);
        await message.reply(`✅ 24/7 Voice connection locked to **${voiceChannel.name}**.`);
    }

    if (content === "()?vcleave") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        settings.voiceChannelId = null;
        saveSettings();

        const connection = joinVoiceChannel({
            channelId: message.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });
        connection.destroy();
        await message.reply("👋 Disconnected from voice channel.");
    }
});

// Audit Logging: Message Delete
client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const logCh = getLogChannel(message.guild, AUDIT_CHANNELS.MESSAGES_THREADS);
    if (!logCh) return;

    const embed = new EmbedBuilder()
        .setColor("#ed4245")
        .setTitle("🗑️ Message Deleted")
        .setDescription(`**Author:** <@${message.author?.id}>\n**Channel:** <#${message.channel.id}>\n**Content:** ${message.content || "*[Embed/Attachment]*"}`)
        .setTimestamp();
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Message Edit
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const logCh = getLogChannel(oldMessage.guild, AUDIT_CHANNELS.MESSAGES_THREADS);
    if (!logCh) return;

    const embed = new EmbedBuilder()
        .setColor("#fee75c")
        .setTitle("✏️ Message Edited")
        .setDescription(`**Author:** <@${oldMessage.author?.id}>\n**Channel:** <#${oldMessage.channel.id}>\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`)
        .setTimestamp();
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Voice State Changes
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const logCh = getLogChannel(newState.guild, AUDIT_CHANNELS.VOICE_LOGS);
    if (!logCh) return;

    if (!oldState.channelId && newState.channelId) {
        logCh.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#57f287")
                    .setTitle("🔊 VC Join")
                    .setDescription(`<@${newState.id}> joined <#${newState.channelId}>`)
                    .setTimestamp()
            ]
        });
    } else if (oldState.channelId && !newState.channelId) {
        logCh.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#ed4245")
                    .setTitle("🔇 VC Leave")
                    .setDescription(`<@${oldState.id}> left <#${oldState.channelId}>`)
                    .setTimestamp()
            ]
        });
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        logCh.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("#5865f2")
                    .setTitle("🔀 VC Move")
                    .setDescription(`<@${newState.id}> moved from <#${oldState.channelId}> to <#${newState.channelId}>`)
                    .setTimestamp()
            ]
        });
    }
});

client.login(BOT_TOKEN);