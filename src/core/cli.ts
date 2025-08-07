import * as readline from 'readline';

export async function startStandaloneCli() {
    console.log("[chitchatter] Starting standalone CLI. Type --help for commands");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (input) => {
        const nextInput = input;
        console.log(`echo: ${nextInput}`);
        if (nextInput.trim() === 'exit') {
            rl.close();
        } else {
            rl.prompt();
        }
    }).on('close', () => {
        process.exit(0);
    });

    rl.prompt();
}