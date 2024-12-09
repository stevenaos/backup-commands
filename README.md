# Backup Server Commands Bot

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
    <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js"/></a>
    <br>
    <img src="https://images-ext-1.discordapp.net/external/XhMU3Cbd5O5qLLqNmSjMwy5my_50VIZ1CGONpCns_h0/%3Fsize%3D4096%26ignore%3Dtrue%29./https/cdn.discordapp.com/avatars/1138397517067854027/2fc0ede8b3cd2dc5484ce74a7a5e8dc3.png?format=webp&quality=lossless&width=473&height=473" alt="Steven G Bot" width="20%"/>
</div>

## 🌐 Hosting the bot yourself

> [!IMPORTANT]
> You can try the bot on its [official Discord server](https://discord.gg/Sb9Y6hx2Ck) without hosting it.

Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers) into config.json

You'll need to install Node.js version v18 or later to run the bot. Then install all required dependencies with `npm i` and run `node deploy-commands` in your terminal to register the slash commands, otherwise they won't show up in Discord. Once everything is set up, run `node index` to start the bot. Each command should load, and "\[Bot\]" will be logged when it's ready.

> [!WARNING]
> Don't forget to give the Discord bot the `bot` and `applications.commands` permissions in the URL generator.

## 💻 Usage

| Command              | Description                                | Arguments                 |
|----------------------|--------------------------------------------|---------------------------|
| /admin backup-load   | Loads a backup file to restore the server | `backup id` (required)     |
| /admin backup-create | Creates a backup of the current server state | None                    |
| /admin backup-list   | Lists all available backup files          | None                       |
| /admin backup-delete | Deletes a specific backup file            | `backup id` (required)     |

