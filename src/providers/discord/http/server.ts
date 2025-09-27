import { Elysia } from 'elysia'


const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!


const app = new Elysia()

app.listen(3000, () => {
    console.log('💚 API running at http://localhost:3000')
})