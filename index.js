console.log("Iniciando...")
const { Client, LocalAuth, Poll } = require('whatsapp-web.js')
const qrcode = require("qrcode-terminal")
const { mentionEveryone, helpMe, sorteiaUm, sorteiaTodos, createSticker, toggleGroupLock, removeParticipant, addParticipant, createPoll, setReminder, infoGrupo, sendMessageToGroup, sendPollToGroup, login} = require('./functions')

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Usa o navegador do sistema (se a variável de ambiente existir)
        executablePath: process.env.CHROME_BIN || undefined,
        // Essencial para o Chromium rodar dentro do isolamento do Docker
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
})

client.on('qr', (qr)=>{
    console.log("Gerando QR code ")
    qrcode.generate(qr, {small: true})
})

client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});

client.on('ready', ()=>{
    console.log("Client pronto para testes!")
})

client.on('message', async(message) => {
    
    if(message.body.startsWith('$ajuda')){
        console.log("Comando $ajuda foi disparado!");
        await helpMe(message)
    }

    if(message.body.startsWith('$todos')){
        console.log("Comando $todos foi disparado!");
        await mentionEveryone(message, client);
    }

    if(message.body.startsWith("$sorteiaTodos")){
        console.log("Comando $sorteio foi disparado!");
        await sorteiaTodos(message);
    }

    if(message.body.startsWith('$sorteiaNumero')){
        console.log("Comando $sorteiaNumero foi mandado")
        await sorteiaUm(message)
    }

    if (message.body.startsWith('$sticker')) {
        console.log("Comando $sticker foi disparado!");
        // Note que precisamos passar o 'client' para a função
        await createSticker(message, client);
    }

    if (message.body.startsWith('$fecharGrupo') || message.body.startsWith('$abrirGrupo')) {
        console.log("Comando de trancar/destrancar grupo foi disparado!");
        await toggleGroupLock(message);
    }

    if (message.body.startsWith('$remover')) {
        console.log("Comando $remover foi disparado!");
        await removeParticipant(message);
    }

    if (message.body.startsWith('$add')) {
        console.log("Comando $add foi disparado!");
        await addParticipant(message);
    }
    if (message.body.startsWith('$enqueteGrupo')) {
        console.log("Comando $enqueteGrupo foi disparado do privado!");
        await sendPollToGroup(message, client);
    }
    else if (message.body.startsWith('$enquete')) {
        console.log("Comando $enquete foi disparado!");
        await createPoll(message);
    }

    if (message.body.startsWith('$lembrete')) {
        console.log("Comando $lembrete foi disparado!");
        await setReminder(message);
    }

    if (message.body.startsWith('$infoGrupo')) {
        console.log("Comando $infoGrupo foi disparado!");
        await infoGrupo(message);
    }

    if (message.body.startsWith('$enviar')) {
        console.log("Comando $enviar foi disparado do privado!");
        await sendMessageToGroup(message, client);
    }

    if (message.body.startsWith("$login")){
        console.log("Comando $login foi disparado")
        await login(message)
    }

});

client.initialize();

// Encerramento elegante para evitar erros com nodemon/reinicializações
process.on('SIGINT', async () => {
  console.log('Recebido SIGINT. Encerrando o cliente...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM. Encerrando o cliente...');
    await client.destroy();
    process.exit(0);
});
