import { Elysia, t } from 'elysia'
import path from 'path'
import { pRateLimit } from 'p-ratelimit'
import { generateName } from '../utils/discord/generate-name'
import 'dotenv/config'
import compressing from 'compressing'



const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const GUILD_ID = process.env.GUILD_ID
const DISCORD_API_EMOJI_LINK = `https://discord.com/api/v10/guilds/${GUILD_ID}/emojis`
const MAX_IMAGES = 50

const rateLimit = pRateLimit({
    interval: 1000,
    rate: 5,
    concurrency: 3
})

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

function getCompressionType(file: any): keyof typeof compressing {
    if (file.mimetype.includes('zip') || /\.zip$/i.test(file.filename))
        return 'zip'
    if (file.mimetype.includes('tar') || /\.tar$/i.test(file.filename))
        return 'tar'
    if (file.mimetype.includes('gzip') || /\.gz$/i.test(file.filename))
        return 'gzip'
    return 'zip'
}


new Elysia()
    .post('/mass-upload', async ({ body, set }) => {

        const { file } = body

        if (!file || file.length === 0) {
            set.status = 400
            return { error: 'No file uploaded' }
        }

        const uploadedFile = file[0];

        const supportedTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/vnd.rar',
            'application/x-rar-compressed',
            'application/x-tar',
            'application/gzip',
            'application/x-gzip',
            'application/octet-stream'
        ]

        const isValidType = supportedTypes.includes(uploadedFile.mimetype) ||
            /\.(zip|rar|tar|gz)$/i.test(uploadedFile.filename)

        if (!isValidType) {
            set.status = 400
            return { error: 'Invalid file type. Please upload a ZIP, RAR, TAR, or GZ file.' }
        }

        try {
            const buffer = Buffer.isBuffer(uploadedFile.data)
                ? uploadedFile.data
                : Buffer.from(uploadedFile.data, 'base64')

            const compressionType = getCompressionType(uploadedFile)
            const files: { name: string; buffer: Buffer }[] = []

            await new Promise<void>((resolve, reject) => {
                const stream = new compressing[compressionType].UncompressStream()

                stream.on('error', reject)

                stream.on('entry', (header, stream, next) => {
                    if (/\.(png|jpe?g|gif|webp)$/i.test(header.name)) {
                        const chunks: Buffer[] = []

                        stream.on('data', (chunk: Buffer) => {
                            chunks.push(chunk)
                        })

                        stream.on('end', () => {
                            files.push({
                                name: path.basename(header.name),
                                buffer: Buffer.concat(chunks)
                            })
                            next()
                        })
                    } else {
                        stream.resume()
                        next()
                    }
                })
                stream.on('finish', resolve)
                stream.end(buffer)
            })

            if (files.length === 0) {
                set.status = 400
                return { error: 'No valid images found in the file' }
            }

            if (files.length > MAX_IMAGES) {
                set.status = 400
                return { error: `Too many images in the file (maximum ${MAX_IMAGES}) - you tried to upload ${files.length}` }
            }

            if (!DISCORD_BOT_TOKEN || !GUILD_ID) {
                set.status = 500;
                return { error: 'Server configuration error: Missing DISCORD_BOT_TOKEN or GUILD_ID' };
            }

            const uploadResults = await Promise.all(
                files.map(async ({ name, buffer }) =>
                    rateLimit(async () => {
                        try {
                            const result = await UploadEmoji(name, buffer)
                            return { name, success: true, id: result.id }
                        } catch (error) {
                            return {
                                name,
                                success: false,
                                error: (error as Error).message
                            }
                        }
                    })
                )
            )

            return {
                success: true,
                uploaded: uploadResults.filter(r => r.success),
                failed: uploadResults.filter(r => !r.success)
            }
        } catch (error) {
            set.status = 500
            return {
                error: 'Failed to process the uploaded file',
                details: (error as Error).message
            }
        }
    },
        {
            body: t.Object({
                file: t.Optional(
                    t.Array(
                        t.Object({
                            data: t.Union([t.String(), t.Any()]),
                            filename: t.String(),
                            mimetype: t.String()
                        })
                    )
                )
            })
        })
    .listen(3000, () => console.log('💚 Mass Emoji Uploader running on http://localhost:3000'))



