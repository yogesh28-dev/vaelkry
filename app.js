import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    EmbedBuilder,
    PermissionFlagsBits,
    Collection
} from "discord.js";
import {
    joinVoiceChannel,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection
} from "@discordjs/voice";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep-Alive Express Server for Railway / Hosting
const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => res.send("V Λ Σ L K Я Y Enterprise Engine Online."));
app.listen(PORT, () => console.log(`Keep-Alive server active on port ${PORT}`));

// Bot Configuration Constants
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const AUTO_ROLE_ID = "1543303146686648432";
const BANNER_URL = "https://cdn.discordapp.com/attachments/1542886509563093882/1545328886842953728/vaelkry_banner.png";
const WELCOME_CHANNEL_ID = "1542886509563093082";
const GOODBYE_CHANNEL_ID = "1542886546032697394";
const LOG_MODERATION_ID = "1543297405003505694";
const LOG_CHANNELS_ID = "1543297431217770667";
const LOG_ROLES_ID = "1543297473840418937";
const LOG_INVITES_ID = "1543297554769248307";
const LOG_MESSAGES_ID = "1543297578509144184";
const EMBED_COLOR = 0x2B2D31;

// Config File for Saved Settings (24/7 VC reconnection)
const CONFIG_FILE = path.join(__dirname, "bot_settings.json");
let settings = {
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

// Cache for Invite Tracker: Map<guildId, Collection<code, uses>>
const invitesCache = new Map();

async function fetchGuildInvites(guild) {
    try {
        const invites = await guild.invites.fetch();
        const codeUsesMap = new Collection();
        invites.forEach(inv => codeUsesMap.set(inv.code, inv.uses));
        invitesCache.set(guild.id, codeUsesMap);
    } catch (err) {
        console.error(`Failed to fetch invites for guild ${guild.id}:`, err);
    }
}

function createSecurityEmbed(title, description, color = EMBED_COLOR) {
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

// 24/7 Voice Connection Handler
async function connectToVoice(channel) {
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

// Client Ready Event
client.once(Events.ClientReady, async (c) => {
    console.log(`🤖 Bot online: ${c.user.tag}`);

    // Cache invites for all guilds
    for (const guild of client.guilds.cache.values()) {
        await fetchGuildInvites(guild);
    }

    // Auto-reconnect to 24/7 voice channel if configured
    if (settings.guildId && settings.voiceChannelId) {
        const guild = client.guilds.cache.get(settings.guildId);
        if (guild) {
            const voiceChannel = guild.channels.cache.get(settings.voiceChannelId);
            if (voiceChannel && voiceChannel.isVoiceBased()) {
                await connectToVoice(voiceChannel);
                console.log(`🔊 Reconnected to 24/7 Voice: ${voiceChannel.name}`);
            }
        }
    }
});

// Guild Member Add Event: Auto-role, Invite Tracker & Welcome Embed
client.on(Events.GuildMemberAdd, async (member) => {
    // 1. Auto-role assignment for new members
    try {
        await member.roles.add(AUTO_ROLE_ID);
    } catch (err) {
        console.error(`Failed to auto-assign role to member ${member.id}:`, err);
    }

    // 2. Resolve Inviter using Invite Tracker
    let inviterText = "Unknown";
    try {
        const cachedInvites = invitesCache.get(member.guild.id);
        const newInvites = await member.guild.invites.fetch();

        if (cachedInvites) {
            const usedInvite = newInvites.find(inv => {
                const prevUses = cachedInvites.get(inv.code) || 0;
                return inv.uses > prevUses;
            });
            if (usedInvite && usedInvite.inviter) {
                inviterText = `<@${usedInvite.inviter.id}>`;
            }
        }

        // Refresh cached invites for the guild
        const codeUsesMap = new Collection();
        newInvites.forEach(inv => codeUsesMap.set(inv.code, inv.uses));
        invitesCache.set(member.guild.id, codeUsesMap);
    } catch (err) {
        console.error("Invite tracking error on member join:", err);
    }

    // 3. Send Welcome Message & Embed to WELCOME_CHANNEL_ID
    const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) || await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
    if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
                name: "⸜  V Λ Σ L K Я Y  ⸝",
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle(`Welcome to V Λ Σ L K Я Y — ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(
                `*Your destination for premium digital solutions.*\n\n` +
                `Explore our ecosystem of **Discord Services**, **Custom Bots**, **Automation**, **Optimization**, **Creative Services & Digital Resources**.\n\n` +
                `⇋ **GET STARTED** ⇌\n\n` +
                `↠ Read our guidelines ➔ <#1542886572221792286>\n` +
                `↠ Explore our services ➔ <#1542887034178506873>\n` +
                `↠ Access free resources ➔ <#1542886768364355704>\n` +
                `↠ Need assistance? ➔ <#1543198370561130596>\n` +
                `↠ Stay updated ➔ <#1543198631878856744>\n\n` +
                `📌 **Invited by ${inviterText}**\n\n` +
                `**BUILD • AUTOMATE • OPTIMIZE • CREATE**\n\n` +
                `*Thank you for choosing V Λ Σ L K Я Y.*`
            )
            .setImage(BANNER_URL)
            .setFooter({
                text: `Member #${member.guild.memberCount} • V Λ Σ L K Я Y Ecosystem`
            })
            .setTimestamp();

        await welcomeChannel.send({
            content: `Hey <@${member.id}>, welcome to **V Λ Σ L K Я I Σ S**!`,
            embeds: [welcomeEmbed]
        }).catch(err => console.error("Error sending welcome embed:", err));
    }

    // 4. Audit Logging: Member Join -> LOG_MODERATION_ID
    const modLogCh = client.channels.cache.get(LOG_MODERATION_ID) || await client.channels.fetch(LOG_MODERATION_ID).catch(() => null);
    if (modLogCh) {
        const embed = createSecurityEmbed(
            "📥 Member Joined",
            `**Member:** <@${member.id}>\n**Username:** ${member.user.tag}\n**Account Age:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
            "#57F287"
        );
        modLogCh.send({ embeds: [embed] }).catch(() => {});
    }
});

// Guild Member Remove Event: Goodbye Embed & Audit Logging
client.on(Events.GuildMemberRemove, async (member) => {
    // 1. Send Goodbye Embed to GOODBYE_CHANNEL_ID
    const goodbyeChannel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID) || await client.channels.fetch(GOODBYE_CHANNEL_ID).catch(() => null);
    if (goodbyeChannel) {
        const byeEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
                name: "⸜  V Λ Σ L K Я Y  ⸝",
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle(`Farewell — ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(`We are sad to see you leave **V Λ Σ L K Я I Σ S**. We hope to see you again soon!`)
            .setImage(BANNER_URL)
            .setFooter({
                text: `Remaining Members: ${member.guild.memberCount} • V Λ Σ L K Я Y Ecosystem`
            })
            .setTimestamp();

        await goodbyeChannel.send({ embeds: [byeEmbed] }).catch(err => console.error("Error sending goodbye embed:", err));
    }

    // 2. Audit Logging: Member Left -> LOG_MODERATION_ID
    const modLogCh = client.channels.cache.get(LOG_MODERATION_ID) || await client.channels.fetch(LOG_MODERATION_ID).catch(() => null);
    if (modLogCh) {
        const embed = createSecurityEmbed(
            "📤 Member Left",
            `**Member:** <@${member.id}>\n**Username:** ${member.user.tag}`,
            "#ED4245"
        );
        modLogCh.send({ embeds: [embed] }).catch(() => {});
    }
});

// Command & Message Listener
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    const args = content.split(/\s+/);
    const cmd = args[0].toLowerCase();

    // Custom Embed Sender Command: ()?vaelmess [Title] Message body
    if (content.startsWith("()?vaelmess")) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const match = content.match(/^\(\)\?vaelmess\s+\[(.*?)\]\s*([\s\S]*)/i);
        if (!match) {
            return message.reply("⚠️ Format:\n`()?vaelmess [Your Title]`\nYour message body goes here...");
        }

        const embedTitle = match[1].trim();
        const embedBody = match[2].trim();

        const customEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
                name: "⸜  V Λ Σ L K Я Y  ⸝",
                iconURL: client.user.displayAvatarURL()
            })
            .setTitle(embedTitle)
            .setDescription(embedBody)
            .setImage(BANNER_URL)
            .setFooter({
                text: "V Λ Σ L K Я Y Ecosystem"
            })
            .setTimestamp();

        await message.channel.send({ embeds: [customEmbed] });
        await message.delete().catch(() => {});
        return;
    }

    // 24/7 Voice Join Command: ()?vcjoin [channel_id]
    if (cmd === "()?vcjoin") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        let voiceChannel = null;
        if (args[1]) {
            voiceChannel = message.guild.channels.cache.get(args[1]) || await message.guild.channels.fetch(args[1]).catch(() => null);
        } else {
            voiceChannel = message.member.voice?.channel;
        }

        if (!voiceChannel || !voiceChannel.isVoiceBased()) {
            return message.reply("❌ Specify a valid voice channel ID or join a voice channel first!");
        }

        settings.guildId = message.guild.id;
        settings.voiceChannelId = voiceChannel.id;
        saveSettings();

        await connectToVoice(voiceChannel);
        await message.reply(`✅ 24/7 Voice connection locked to **${voiceChannel.name}**.`);
    }

    // 24/7 Voice Leave Command: ()?vcleave
    if (cmd === "()?vcleave") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        settings.voiceChannelId = null;
        saveSettings();

        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
        }
        await message.reply("👋 Disconnected from voice channel.");
    }

    // Bulk Role Assignment Command: ()?giveroleall
    if (cmd === "()?giveroleall") {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const statusMsg = await message.reply("⏳ Starting member fetching and role assignment...");
        try {
            const members = await message.guild.members.fetch();
            let updatedCount = 0;

            for (const member of members.values()) {
                if (member.user.bot || member.roles.cache.has(AUTO_ROLE_ID)) continue;

                try {
                    await member.roles.add(AUTO_ROLE_ID);
                    updatedCount++;
                } catch (err) {
                    console.error(`Failed to assign role to ${member.user.tag} (${member.id}):`, err);
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            await statusMsg.edit(`✅ Bulk role assignment complete! Assigned role to **${updatedCount}** members.`);
        } catch (err) {
            console.error("Error during giveroleall command execution:", err);
            await statusMsg.edit("❌ Failed to complete bulk role assignment due to an error.");
        }
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

// Audit Logging: Channel Create / Delete -> LOG_CHANNELS_ID
client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;
    const logCh = client.channels.cache.get(LOG_CHANNELS_ID) || await client.channels.fetch(LOG_CHANNELS_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed("📁 Channel Created", `**Name:** #${channel.name}\n**ID:** ${channel.id}`);
    logCh.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;
    const logCh = client.channels.cache.get(LOG_CHANNELS_ID) || await client.channels.fetch(LOG_CHANNELS_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed("🗑️ Channel Deleted", `**Channel Name:** #${channel.name}\n**ID:** ${channel.id}`);
    logCh.send({ embeds: [embed] }).catch(() => {});
});

// Audit Logging: Role Create / Delete -> LOG_ROLES_ID
client.on(Events.GuildRoleCreate, async (role) => {
    const logCh = client.channels.cache.get(LOG_ROLES_ID) || await client.channels.fetch(LOG_ROLES_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed("🛡️ Role Created", `**Role Name:** <@&${role.id}>\n**Role ID:** ${role.id}`);
    logCh.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.GuildRoleDelete, async (role) => {
    const logCh = client.channels.cache.get(LOG_ROLES_ID) || await client.channels.fetch(LOG_ROLES_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed("🗑️ Role Deleted", `**Role Name:** @${role.name}\n**Role ID:** ${role.id}`);
    logCh.send({ embeds: [embed] }).catch(() => {});
});

// Audit Logging: Invite Create / Delete -> LOG_INVITES_ID
client.on(Events.InviteCreate, async (invite) => {
    if (invite.guild) {
        const guildInvites = invitesCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, invite.uses);
        }
    }

    const logCh = client.channels.cache.get(LOG_INVITES_ID) || await client.channels.fetch(LOG_INVITES_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "🔗 Invite Link Created",
        `**Code:** ${invite.code}\n**Creator:** <@${invite.inviterId}>\n**Channel:** <#${invite.channelId}>`
    );
    logCh.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.InviteDelete, (invite) => {
    if (invite.guild) {
        const guildInvites = invitesCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
        }
    }
});

// Audit Logging: Message Edit / Delete -> LOG_MESSAGES_ID
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const logCh = client.channels.cache.get(LOG_MESSAGES_ID) || await client.channels.fetch(LOG_MESSAGES_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "✏️ Message Edited",
        `**Author:** <@${oldMessage.author?.id}>\n` +
        `**Channel:** <#${oldMessage.channel.id}>\n` +
        `**Before:** ${oldMessage.content || "*[Empty]*"}\n` +
        `**After:** ${newMessage.content || "*[Empty]*"}`,
        EMBED_COLOR
    );
    logCh.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const logCh = client.channels.cache.get(LOG_MESSAGES_ID) || await client.channels.fetch(LOG_MESSAGES_ID).catch(() => null);
    if (!logCh) return;

    const embed = createSecurityEmbed(
        "🗑️ Message Deleted",
        `**Author:** <@${message.author?.id}>\n` +
        `**Channel:** <#${message.channel.id}>\n` +
        `**Content:** ${message.content || "*[No text / media only]*"}`,
        0xED4245
    );
    logCh.send({ embeds: [embed] }).catch(() => {});
});

client.login(BOT_TOKEN);