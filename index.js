console.log("Iniciando...")
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require("qrcode-terminal")
const { mentionEveryone, helpMe, sorteiaUm, sorteiaTodos, createSticker} = require('./functions')

const client = new Client({
    authStrategy: new LocalAuth()
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
        await mentionEveryone(message);
        
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
});

client.initialize();


