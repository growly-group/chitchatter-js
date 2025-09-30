import crypto from 'crypto'
import path from 'path'



export function generateName(fileName: string) {

    const name = path.basename(fileName, path.extname(fileName))
    let discordSafeName = name.replace(/[^a-zA-Z0-9_]/g, '_')

    if (!name) discordSafeName = `emoji_${crypto.randomBytes(4).toString('hex')}`

    const HASH = crypto
        .createHash('md5')
        .update(name + Date.now())
        .digest('hex')
        .slice(0, 5)

    return `${discordSafeName}_${HASH}`
}