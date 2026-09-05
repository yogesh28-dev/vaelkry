import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    EmbedBuilder,
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

// Keep-Alive Server for Railway
const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => res.send("V Λ Σ L K Я Y Enterprise Engine Online."));
app.listen(PORT, () => console.log(`Keep-Alive server active on port ${PORT}`));

// Config File for Saved Channels & VC
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

// Bot Credentials & Permanent Assets
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const BANNER_URI = "https://cdn.discordapp.com/attachments/1542886509563093082/1545320886842953728/vaelkry-banner.png";

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

// Audit Logging Channels
const AUDIT_CHANNELS = {
    MEMBER_ACTIONS: "member-actions-mode",
    CHANNEL_CHANGES: "channel-category-changes",
    ROLES_PERMISSIONS: "roles-permissions",
    SERVER_ASSETS: "server-settings-assets",
    INVITES: "invites-integrations",
    MESSAGES_THREADS: "messages-threads",
    ACTIVITY_ALERTS: "activity-alerts"
};

function getLogChannel(guild, name) {
    return guild.channels.cache.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
}

function createSecurityEmbed(title, description, color = "#2b2d31") {
    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "🛡️ SECURITY STREAM • V Λ Σ L K Я Y"
        })
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "Audit Logging Engine • Enterprise" })
        .setTimestamp();
}

// 24/7 Voice Connection Function
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

// Welcome Event
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
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(
                    `*Your destination for premium digital solutions.*\n\n` +
                    `Explore our ecosystem of **Discord Services**, **Custom Bots**, **Automation**, **Optimization**, **Creative Services & Digital Resources**.\n\n` +
                    `**⇋ GET STARTED ⇋**\n\n` +
                    `↠ Read our guidelines → <#1542886572221792286>\n` +
                    `↠ Explore our services → <#1542887034178506873>\n` +
                    `↠ Access free resources → <#1542886768364355704>\n` +
                    `↠ Need assistance? → <#1543198370561130596>\n` +
                    `↠ Stay updated → <#1543198631878856744>\n\n` +
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
        const embed = createSecurityEmbed(
            "📥 Member Joined",
            `**Member:** <@${member.id}>\n**Username:** ${member.user.tag}\n**Account Age:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
            "#57f287"
        );
        logCh.send({ embeds: [embed] });
    }
});

// Goodbye Event
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
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
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
        const embed = createSecurityEmbed(
            "📤 Member Left",
            `**Member:** <@${member.id}>\n**Username:** ${member.user.tag}`,
            "#ed4245"
        );
        logCh.send({ embeds: [embed] });
    }
});

// Commands, Dynamic Embeds & Moderation Handler
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    const args = content.split(/\s+/);
    const cmd = args[0].toLowerCase();

    // Dynamic Embed Sender Command: ()?vaelmess [Title] Message body
    if (content.startsWith("()?vaelmess")) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const match = content.match(/^\(\)\?vaelmess\s+\[(.*?)\]\s*([\s\S]*)/i);
        if (!match) {
            return message.reply("⚠️ Format:\n`()?vaelmess [Your Title]`\nYour message body goes here...");
        }

        const embedTitle = match[1].trim();
        const embedBody = match[2].trim();

        const customEmbed = new EmbedBuilder()
            .setColor("#000000")
            .setAuthor({
                name: "⸜  V Λ Σ L K Я Y  ⸝",
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setTitle(embedTitle)
            .setDescription(embedBody)
            .setFooter({
                text: "V Λ Σ L K Я Y Ecosystem",
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        await message.channel.send({ embeds: [customEmbed] });
        await message.delete().catch(() => { });
        return;
    }

    // Bot Configuration Commands
    if (cmd === "()?welcomeactivate") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        settings.welcomeChannelId = message.channel.id;
        saveSettings();
        await message.reply(`✅ Welcome messages activated for <#${message.channel.id}>.`);
    }

    if (cmd === "()?byebyeactivate") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        settings.byeChannelId = message.channel.id;
        saveSettings();
        await message.reply(`✅ ByeBye messages activated for <#${message.channel.id}>.`);
    }

    if (cmd === "()?vcjoin") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("❌ Connect to a voice channel first!");

        settings.guildId = message.guild.id;
        settings.voiceChannelId = voiceChannel.id;
        saveSettings();

        await connectToVoice(voiceChannel);
        await message.reply(`✅ 24/7 Voice connection locked to **${voiceChannel.name}**.`);
    }

    if (cmd === "()?vcleave") {
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

    // Moderation Commands
    if (cmd === "()?kick") {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;
        const target = message.mentions.members.first();
        if (!target) return message.reply("Specify member: `()?kick @user reason`");
        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.kick(reason);
        await message.reply(`👢 **${target.user.tag}** has been kicked.`);
    }

    if (cmd === "()?ban") {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
        const target = message.mentions.members.first();
        if (!target) return message.reply("Specify member: `()?ban @user reason`");
        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.ban({ reason });
        await message.reply(`🔨 **${target.user.tag}** has been banned.`);
    }

    if (cmd === "()?mute") {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
        const target = message.mentions.members.first();
        if (!target) return message.reply("Specify member: `()?mute @user [minutes]`");
        const minutes = parseInt(args[2]) || 10;
        await target.timeout(minutes * 60 * 1000, "Muted by moderator");
        await message.reply(`🔇 **${target.user.tag}** muted for ${minutes} minutes.`);
    }

    if (cmd === "()?unmute") {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
        const target = message.mentions.members.first();
        if (!target) return message.reply("Specify member: `()?unmute @user`");
        await target.timeout(null);
        await message.reply(`🔊 **${target.user.tag}** unmuted.`);
    }
});

// Audit Logging: Voice State Updates
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const logCh = getLogChannel(newState.guild, AUDIT_CHANNELS.ACTIVITY_ALERTS) ||
        getLogChannel(newState.guild, "voice-logs");
    if (!logCh) return;

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const embed = createSecurityEmbed(
            "🔄 Voice Channel Switched",
            `**Member**\n<@${newState.id}>\n\n` +
            `**Previous Channel**\t\t**Joined Channel**\n` +
            `🔊 <#${oldState.channelId}>\t\t🔊 <#${newState.channelId}>`
        );
        logCh.send({ embeds: [embed] });
    }
});

// Audit Logging: Channels Created / Deleted
client.on(Events.ChannelCreate, (channel) => {
    if (!channel.guild) return;
    const logCh = getLogChannel(channel.guild, AUDIT_CHANNELS.CHANNEL_CHANGES);
    if (!logCh) return;

    const embed = createSecurityEmbed("📁 Channel Created", `**Name**\n#${channel.name}`);
    logCh.send({ embeds: [embed] });
});

client.on(Events.ChannelDelete, (channel) => {
    if (!channel.guild) return;
    const logCh = getLogChannel(channel.guild, AUDIT_CHANNELS.CHANNEL_CHANGES);
    if (!logCh) return;

    const embed = createSecurityEmbed("🗑️ Channel Deleted", `**Channel Name**\n#${channel.name}`);
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Roles Created / Deleted
client.on(Events.GuildRoleCreate, (role) => {
    const logCh = getLogChannel(role.guild, AUDIT_CHANNELS.ROLES_PERMISSIONS);
    if (!logCh) return;

    const embed = createSecurityEmbed("🛡️ Role Created", `**Role Name**\n<@&${role.id}>`);
    logCh.send({ embeds: [embed] });
});

client.on(Events.GuildRoleDelete, (role) => {
    const logCh = getLogChannel(role.guild, AUDIT_CHANNELS.ROLES_PERMISSIONS);
    if (!logCh) return;

    const embed = createSecurityEmbed("🗑️ Role Deleted", `**Role Name**\n@${role.name}`);
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Invites Created
client.on(Events.InviteCreate, (invite) => {
    const logCh = getLogChannel(invite.guild, AUDIT_CHANNELS.INVITES);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "🔗 Invite Link Created",
        `**Code**\t\t**Creator**\t\t**Channel**\n` +
        `${invite.code}\t\t<@${invite.inviterId}>\t\t<#${invite.channelId}>`
    );
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Message Delete
client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const logCh = getLogChannel(message.guild, AUDIT_CHANNELS.MESSAGES_THREADS);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "🗑️ Message Deleted",
        `**Author:** <@${message.author?.id}>\n` +
        `**Channel:** <#${message.channel.id}>\n` +
        `**Content:** ${message.content || "*[No text / media only]*"}`,
        "#ed4245"
    );
    logCh.send({ embeds: [embed] });
});

// Audit Logging: Message Edit
client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const logCh = getLogChannel(oldMessage.guild, AUDIT_CHANNELS.MESSAGES_THREADS);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "✏️ Message Edited",
        `**Author:** <@${oldMessage.author?.id}>\n` +
        `**Channel:** <#${oldMessage.channel.id}>\n` +
        `**Before:** ${oldMessage.content}\n` +
        `**After:** ${newMessage.content}`,
        "#fee75c"
    );
    logCh.send({ embeds: [embed] });
});

client.login(BOT_TOKEN);