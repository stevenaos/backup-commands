# Backup Server Commands Bot

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
    <a href="https://www.buymeacoffee.com/cornbread2100"><img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"/></a>
    <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js"/></a>
    <a href="https://github.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot"><img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot?style=for-the-badge&logo=github&logoColor=white&logoWidth=20"/></a>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Logo" width="20%"/>
</div>

## 📝 About

This is the complete code for a Node.js Discord bot. This bot doesn't do the scanning itself, it just displays the scanned servers from my database, which is actively collected by a separate scanning program. You can access it yourself at <https://api.cornbread2100.com/servers> by sending a MongoDB find query in a POST request.

If you find any bugs, please report them in the [official Discord server](https://discord.gg/TSWcF2m67m).

You can contact me via Discord: [cornbread2100](https://discord.com/users/720658048611516559)

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

