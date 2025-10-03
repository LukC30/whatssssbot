import { error } from "qrcode-terminal";

export const isAdmin = async (message) => {
    const chat = await message.getChat();
    // 1. Se não for um grupo, não há admin. Retorna false.
    if (!chat.isGroup) return false;

    // 2. Encontra o participante que enviou a mensagem.
    const sender = chat.participants.find(p => p.id._serialized === message.author);
    if (!sender) {
        // Não deveria acontecer em um grupo, mas é uma boa prática de segurança.
        return false; 
    }
    return sender.isAdmin;
}

export const helpMe = async(message) => {
    const chat = await message.getChat();

    if(!(await isAdmin(message)) || !chat.isGroup) return;

    const text = `🤖 *Olá! Sou seu bot assistente!* 🤖

Aqui está uma lista dos meus superpoderes (comandos):

- *$ajuda*: 🙋‍♂️ Mostra esta mensagem de ajuda.
- *$todos <mensagem (Opcional)>*: 📢 Menciona todo mundo com sua mensagem!
- *$sorteioTodos*: 🎲 Sorteia um sortudo entre todos os membros do grupo.
- *$sorteiaNumero <número>*: 🔢 Sorteia um número de 1 até o que você escolher.

Fique de olho! 👀 Novas funcionalidades estão a caminho para deixar o grupo ainda mais divertido! ✨`
    
    console.log("Enviando mensagem...");
    await message.reply(text)
    console.log("Mensagem enviada!");
    return
}

export const sorteiaUm = async(message) => {
    const chat = await message.getChat();
    if(!(await isAdmin(message)) || !chat.isGroup) return;
    
    const number = parseInt(message.body.replace('$sorteiaNumero', '').trim())
    if(isNaN(number)) return message.reply("Comando invalido!!!")
    
    const sorteio = Math.floor(Math.random() * number)

    let text = `O número sorteado foi: ${sorteio}\nParabéns!!!!!`
    console.log("Enviando mensagem...");
    await message.reply(text)
    console.log("Mensagem enviada!");
}

export const mentionEveryone = async(message) => {
    const chat = await message.getChat();
    
    console.log(message.author);
    
    if(!(await isAdmin(message)) || !chat.isGroup) return;

    const customText = message.body.replace('$todos', '').trim();
    const text = customText ? `📢 **Marcando geral!** 📢\n\n${customText}` : '📢 **Marcando geral!** 📢';
    let mentions = [];

    console.log(`Encontrado ${chat.participants.length} participantes no grupo`);

    for(let participant of chat.participants){
        mentions.push(participant.id._serialized); 
    }

    console.log('Enviando mensagem...');
    // Simula que o bot está "digitando" a resposta.
    await chat.sendStateTyping();

    // Adiciona um atraso aleatório (entre 1 e 3 segundos) para parecer mais humano.
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(Math.floor(Math.random() * 2000) + 1000);

    await chat.sendMessage(text, { mentions });

    console.log('Mensagem enviada com sucesso!');
}


export const sorteiaTodos = async (message) => {
    const chat = await message.getChat();

    if(!(await isAdmin(message)) || !chat.isGroup) return;

    let participantList = []
    
    for(let participant of chat.participants){
        participantList.push(participant)
    }

    let number = Math.floor(Math.random() * participantList.length)
    let participantLucky = participantList[number]
    let text = `O participante sorteado foi: @${participantLucky.id.user}!\nParabéns heheheheh`

    console.log("Enviando mensagem...");
    
    let mention = [participantLucky.id._serialized]
    await chat.sendMessage(text, { mention });

    console.log("Mensagem enviada!");
}

export const createSticker = async (message, client) =>{
    if(message.hasMedia){
        try {
            console.log("Baixando midia...")
            const media = await message.downloadMedia()

            await client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerAuthor: "Criado pelo mEEEEEEEEEEEW",
                stickerName: 'sla dog'
            })

            console.log("Fig enviada com sucesso")
        } catch (e) {
            console.error("Erro ao criar sticker: ", e)
            await message.reply("❌ Ops! Não consegui criar o sticker. Tente com outra imagem.");
        }
    } else {
        await message.reply("Para criar um sticker, envie uma imagem com a legenda *$sticker*!");
    }

}