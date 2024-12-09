const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs'); // For backup operations
const path = require('path');
const backupsDir = path.join(__dirname, '../backups'); // Backup directory

if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

const timedOutUsers = new Map(); // Map to store users with their timeout expiry time

module.exports = {
    data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands')
    .addSubcommand(subcommand =>
        subcommand
            .setName('timeout')
            .setDescription('Timeout a user')
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Choose the action: set or remove')
                    .setRequired(true)
                    .addChoices(
                        { name: 'set', value: 'set' },
                        { name: 'remove', value: 'remove' }
                    ))
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to be timed out')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('duration')
                    .setDescription('Duration in seconds (required for set action)')
                    .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel (current channel if not specified)')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('Channel to lock')))
        .addSubcommand(subcommand =>
            subcommand.setName('unlock').setDescription('Unlock a channel (current channel if not specified)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to kick').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('User to ban').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('nuke')
                .setDescription('Nuke a channel (delete and recreate it)'))
        .addSubcommand(subcommand =>
            subcommand.setName('backup-create').setDescription('Create a backup'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup-load')
                .setDescription('Load a backup by ID')
                .addStringOption(option =>
                    option.setName('backupid').setDescription('ID of the backup').setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('backup-remove')
                .setDescription('Remove a backup by ID')
                .addStringOption(option => {
                    const backupIds = fs.readdirSync(backupsDir)
                        .filter(file => file.endsWith('.json'))
                        .map(file => file.replace('.json', ''));
                    
                    return option
                        .setName('backupid')
                        .setDescription('ID of the backup')
                        .setRequired(true)
                        .addChoices(backupIds.map(id => ({ name: id, value: id })));
                }))
        .addSubcommand(subcommand =>
            subcommand.setName('backup-list').setDescription('List all backups')),

    async autocomplete(interaction) {
        if (interaction.commandName === 'admin' && interaction.options.getSubcommand() === 'backup-load') {
            const focusedOption = interaction.options.getFocused();
            const backupFiles = fs.readdirSync(backupsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    // Ambil ID acak dari nama file
                    const fileId = file.replace('.json', '');
                    const filePath = path.join(backupsDir, file);
    
                    // Buka isi file untuk membaca data backup
                    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    // Format nama untuk ditampilkan
                    const serverName = backupData.serverName;
                    const date = new Date(fileId.slice(0, 10)); // Ambil timestamp dari ID acak
                    const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    
                    return {
                        name: `${serverName} | ${formattedDate} (${fileId})`,
                        value: fileId
                    };
                });
    
            // Filter pilihan yang sesuai dengan input yang difokuskan
            const choices = backupFiles.filter(choice => choice.name.toLowerCase().includes(focusedOption.toLowerCase()));
            await interaction.respond(choices);
        }
        if (interaction.commandName === 'admin' && interaction.options.getSubcommand() === 'timeout' && interaction.options.getString('action') === 'remove') {
            const focusedOption = interaction.options.getFocused();
            const choices = Array.from(timedOutUsers.keys()).map(userId => {
                const member = interaction.guild.members.cache.get(userId);
                if (member) {
                    return {
                        name: member.user.tag,
                        value: userId
                    };
                }
            }).filter(Boolean);

            const filteredChoices = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.toLowerCase()));
            await interaction.respond(filteredChoices);
        }
    },

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            switch (subcommand) {
                case 'timeout': {
                    const action = interaction.options.getSubcommand(); // Get the subcommand (either 'set' or 'remove')
                
                    if (action === 'set') {
                        const user = interaction.options.getUser('user');
                        const time = interaction.options.getInteger('time') * 1000; // Convert time to milliseconds
                        const member = interaction.guild.members.cache.get(user.id);
                
                        if (!member) {
                            return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
                        }
                
                        await member.timeout(time);
                        timedOutUsers.set(user.id, Date.now() + time);
                
                        return interaction.reply({ content: `${user.tag} has been timed out for ${time / 1000} seconds.`, ephemeral: true });
                    }
                
                    if (action === 'remove') {
                        const user = interaction.options.getUser('user');
                        if (!timedOutUsers.has(user.id)) {
                            return interaction.reply({ content: 'This user is not currently timed out.', ephemeral: true });
                        }
                
                        const member = interaction.guild.members.cache.get(user.id);
                        if (member) {
                            await member.timeout(null); // Remove timeout
                            timedOutUsers.delete(user.id);
                
                            return interaction.reply({ content: `${member.user.tag}'s timeout has been removed.`, ephemeral: true });
                        } else {
                            return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
                        }
                    }
                    break;
                }                
                case 'lock': {
                    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SEND_MESSAGES: false });
                    return interaction.reply({ content: `${channel} has been locked.`, ephemeral: true });
                }
                case 'unlock': {
                    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SEND_MESSAGES: true });
                    return interaction.reply({ content: `${channel} has been unlocked.`, ephemeral: true });
                }
                case 'kick': {
                    const user = interaction.options.getUser('user');
                    const member = interaction.guild.members.cache.get(user.id);

                    if (!member) {
                        return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
                    }

                    await member.kick();
                    return interaction.reply({ content: `${user.tag} has been kicked from the server.`, ephemeral: true });
                }
                case 'ban': {
                    const user = interaction.options.getUser('user');
                    await interaction.guild.members.ban(user.id);
                    return interaction.reply({ content: `${user.tag} has been banned from the server.`, ephemeral: true });
                }
                case 'nuke': {
                    const position = channel.position;
                    const name = channel.name;
                    const newChannel = await channel.clone();
                    await channel.delete();
                    await newChannel.setPosition(position);
                    return interaction.reply({ content: `Channel ${name} has been nuked!`, ephemeral: true });
                }
                case 'backup-create': {
                    // Format ID tampilan: <server name> | <day month year - hour:minute>
                    const serverName = interaction.guild.name.replace(/[^a-zA-Z0-9 ]/g, '_'); // Mengganti karakter non-alfanumerik dengan _
                    
                    // Format tanggal
                    const date = new Date();
                    const options = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                    const formattedDate = date.toLocaleDateString('en-US', options).replace(',', ''); // Format: "8 April 2024 - 14:30"
                
                    // ID acak untuk nama file
                    const randomId = Math.random().toString(36).substring(2, 12).toUpperCase(); // ID acak, diubah ke huruf kapital
                
                    // Format ID tampilan
                    const displayBackupId = `${serverName} | ${formattedDate}`;
                
                    // Menyimpan data backup ke file dengan nama ID acak
                    const backupData = {
                        serverName: interaction.guild.name,
                        serverIcon: interaction.guild.iconURL(),
                        channels: interaction.guild.channels.cache.filter(c => !['GUILD_CATEGORY', 'GUILD_NEWS'].includes(c.type))
                            .map(channel => ({
                                id: channel.id,
                                name: channel.name,
                                position: channel.position,
                                type: channel.type,
                                parentId: channel.parentId,
                                permissions: channel.permissionOverwrites.cache.map(overwrite => ({
                                    id: overwrite.id,
                                    allow: BigInt(overwrite.allow),
                                    deny: BigInt(overwrite.deny),
                                }))
                            })),
                        roles: interaction.guild.roles.cache.map(role => ({
                            id: role.id,
                            name: role.name,
                            permissions: role.permissions.toArray(),
                            color: role.color,
                            hoist: role.hoist,
                            mentionable: role.mentionable,
                        })),
                        emojis: interaction.guild.emojis.cache.map(emoji => ({
                            id: emoji.id,
                            name: emoji.name,
                        })),
                    };
                
                    // Menggunakan ID acak untuk nama file
                    const safeRandomId = randomId.replace(/[^a-zA-Z0-9]/g, '_'); // Mengganti karakter non-alfanumerik di ID untuk nama file
                    const filePath = path.join(backupsDir, `${safeRandomId}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(backupData));
                
                    return interaction.reply({ content: `Backup created successfully with ID: ${displayBackupId} (${randomId})`, ephemeral: true });
                }
                case 'backup-load': {
                    const backupId = interaction.options.getString('backupid');
                    const backupPath = path.join(backupsDir, `${backupId}.json`);
                    if (!fs.existsSync(backupPath)) {
                        return interaction.reply({ content: 'Backup not found.', ephemeral: true });
                    }
                
                    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                
                    // Check if the backup data has the required properties
                    if (!backupData.channels || !Array.isArray(backupData.channels)) {
                        return interaction.reply({ content: 'Invalid backup data: channels missing or malformed.', ephemeral: true });
                    }
                    if (!backupData.roles || !Array.isArray(backupData.roles)) {
                        return interaction.reply({ content: 'Invalid backup data: roles missing or malformed.', ephemeral: true });
                    }
                    if (!backupData.emojis || !Array.isArray(backupData.emojis)) {
                        return interaction.reply({ content: 'Invalid backup data: emojis missing or malformed.', ephemeral: true });
                    }
                
                    // Create confirmation embed
                    const confirmationEmbed = new EmbedBuilder()
                        .setTitle('Backup Load Confirmation')
                        .setDescription(`Are you sure you want to load the backup with ID **${backupId}**?`)
                        .setColor(0xFF0000);
                
                    // Generate buttons
                    const previewButton = new ButtonBuilder()
                        .setCustomId('preview-backup')
                        .setLabel('Preview')
                        .setStyle(ButtonStyle.Secondary);
                
                    const yesButton = new ButtonBuilder()
                        .setCustomId('confirm-load')
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Success);
                
                    const noButton = new ButtonBuilder()
                        .setCustomId('cancel-load')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger);
                
                    const row = new ActionRowBuilder().addComponents(previewButton, yesButton, noButton);
                
                    // Reply directly without deferring
                    await interaction.reply({
                        embeds: [confirmationEmbed],
                        components: [row],
                        ephemeral: true,
                    });
                
                    const filter = i => i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
                    collector.on('collect', async i => {
                        if (i.customId === 'preview-backup') {
                            const previewEmbed = new EmbedBuilder()
                                .setTitle(`Preview of Backup ${backupId}`)
                                .setColor(0x00FF00)
                                .setDescription(`
                                    **Server Name**: ${backupData.serverName}
                                    **Server Icon**: ${backupData.serverIcon ? `[Click here to view icon](${backupData.serverIcon})` : 'No icon'}
                
                                    **Channels (Total: ${backupData.channels.length})**
                                    ${backupData.channels.map(channel => `- ${channel.name} (ID: ${channel.id})`).join('\n')}
                
                                    **Roles (Total: ${backupData.roles.length})**
                                    ${backupData.roles.map(role => `- ${role.name} (ID: ${role.id})`).join('\n')}
                
                                    **Emojis (Total: ${backupData.emojis.length})**
                                    ${backupData.emojis.map(emoji => `- ${emoji.name} (ID: ${emoji.id})`).join('\n')}
                                `);
                
                            await i.update({ embeds: [previewEmbed], components: [] });
                        } else if (i.customId === 'confirm-load') {
                            // Load the backup data as before...
                            for (const channelData of backupData.channels) {
                                if (channelData.type === 'GUILD_TEXT') {
                                    await interaction.guild.channels.create({
                                        name: channelData.name,
                                        type: 0, // 'GUILD_TEXT'
                                        position: channelData.position,
                                        parent: channelData.parentId,
                                        permissionOverwrites: channelData.permissions.map(perm => ({
                                            id: perm.id,
                                            allow: BigInt(perm.allow),
                                            deny: BigInt(perm.deny),
                                        }))
                                    });
                                }
                            }
                
                            await i.update({ content: `Backup ${backupId} loaded successfully.`, components: [] });
                        } else if (i.customId === 'cancel-load') {
                            await i.update({ content: 'Backup load cancelled.', components: [] });
                        }
                    });
                }                
                case 'backup-remove': {
                    const backupId = interaction.options.getString('backupid');
                    const backupPath = path.join(backupsDir, `${backupId}.json`);
                    if (!fs.existsSync(backupPath)) {
                        return interaction.reply({ content: 'Backup not found.', ephemeral: true });
                    }
                    fs.unlinkSync(backupPath);
                    return interaction.reply({ content: `Backup ${backupId} removed successfully.`, ephemeral: true });
                }
                case 'backup-list': {
                    const backupIds = fs.readdirSync(backupsDir)
                        .filter(file => file.endsWith('.json'))
                        .map(file => file.replace('.json', ''));
                    return interaction.reply({ content: `Available backups: ${backupIds.join(', ')}`, ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error executing admin command:', error);
            return interaction.reply({ content: 'An error occurred while executing that command.', ephemeral: true });
        }
    },
};
