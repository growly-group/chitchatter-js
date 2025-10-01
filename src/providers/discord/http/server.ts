import { Elysia } from 'elysia'
import path from 'path'
import { pRateLimit } from 'p-ratelimit'
import { generateName } from '../utils/discord/generate-name'
import { unzip } from 'unzipit';
import fs from "fs";
import 'dotenv/config'


const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!
const GUILD_ID = process.env.GUILD_ID!
const DISCORD_API_EMOJI_LINK = `https://discord.com/api/v10/guilds/${GUILD_ID}/emojis`

async function UploadEmoji(fileName: string, buffer: Buffer) {
    const base64 = buffer.toString('base64')
    const extension = path.extname(fileName).replace('.', '')
    const name = generateName(fileName)

    const body = {
        name: name,
        image: `data:image/${extension};base64,${base64}`
    }

    const res = await fetch(DISCORD_API_EMOJI_LINK, {
        method: 'POST',
        headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Failed to upload emoji: ${fileName} - ${err}`)
    }

    return res.json()
}







