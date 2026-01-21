const { Poll } = require('whatsapp-web.js');
const readline = require('readline');

// ID do "dono" do bot. Substitua pelo seu ID de usuário (ex: '5511999999999@c.us').
// O dono terá permissões especiais.
const OWNER_ID = ['126250681147501@lid'];

/**
 * Objeto para armazenar usuários autorizados a usar comandos de admin.
 * Formato: { 'ID_DO_GRUPO@g.us': ['ID_DO_USUARIO_1@c.us', 'ID_DO_USUARIO_2@c.us'] }
 * Você pode preencher isso manualmente usando o comando $login para obter os IDs.
 */
const AUTHORIZED_USERS = {
    '120363041234567890@g.us': ['5511991932901@c.us'], // Exemplo de grupo e usuário autorizado
    '120363423715918898@g.us': ['126250681147501@lid'],
    '120363403376333095@g.us': ['212845878857734@lid'],
    '120363423192259256@g.us': ['147631045087455@lid'],
    '120363400037911623@g.us': ['212845878857734@lid', '138671676223699@lid'],
    '120363402750421216@g.us': ['9732412682436@lid'],

    // 'ID_DO_GRUPO@g.us': ['ID_DO_USUARIO@c.us'],
};

const isAuthorized = async (message) => {
    const chat = await message.getChat();
    
    console.log("--- DEBUG ISAUTHORIZED ---");
    console.log("1. É grupo?", chat.isGroup);

    if (!chat.isGroup) {
        console.log("❌ Falha: Não é um grupo.");
        return false;
    }
    
    let contactId = message.author;
    
    if (!contactId && message.fromMe) {
        console.log("⚠️ Mensagem enviada pelo próprio bot/host. Tentando identificar ID...");
        const myUser = chat.participants.find(p => p.id._serialized === message.id.participant);
        if(myUser) contactId = myUser.id._serialized;
    }

    // Verificação de usuário autorizado na lista hardcoded
    console.log(message)
    const groupId = chat.id._serialized;
    const authorizedUsersInGroup = AUTHORIZED_USERS[groupId] || [];
    if (authorizedUsersInGroup.includes(contactId) || OWNER_ID) {
        console.log("✅ Resultado Final: Usuário está na lista de autorizados para este grupo.");
        console.log("--------------------------");
        return true;
    }

    console.log(`   (Usuário ${contactId} não está na lista de autorizados para o grupo ${groupId})`);

    console.log("2. ID do Autor detectado:", contactId);

    if (!contactId) {
        console.log("❌ Falha: ID do autor indefinido.");
        return false;
    }

    const participant = chat.participants.find(p => p.id._serialized === contactId);

    if (!participant) {
        console.log("❌ Falha: Participante não encontrado na lista do grupo.");
        console.log("   (Dica: Verifique se o ID tem sufixo diferente, ex: :12@c.us)");
        return false;
    }

    console.log("3. Dados do participante:", { 
        admin: participant.isAdmin, 
        superAdmin: participant.isSuperAdmin 
    });

    const isAdmin = participant.isAdmin || participant.isSuperAdmin;
    console.log("✅ Resultado Final (Admin Check):", isAdmin);
    console.log("--------------------------");

    return isAdmin;
}
const createPoll = async (message) => {
    // Ex: $enquete "Qual sua cor favorita?" "Azul" "Vermelho" "Verde"
    if (!(await isAuthorized(message))) {
        return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const pollData = message.body.match(/"(.*?)"/g)?.map(s => s.replace(/"/g, ''));

    if (!pollData || pollData.length < 2) {
        return message.reply('Formato incorreto! Use: *$enquete "Pergunta" "Opção 1" "Opção 2" ...*');
    }

    const [question, ...options] = pollData;

    try {
        await message.reply(new Poll(question, options));
        console.log("Enquete criada com sucesso!");
    } catch (e) {
        console.error("Erro ao criar enquete:", e);
        message.reply("❌ Ops! Não consegui criar a enquete.");
    }
}


const helpMe = async(message) => {
    const chat = await message.getChat();
    
    const text = `🤖 *Olá! Sou o seu bot assistente!* 🤖

Aqui está a minha lista de superpoderes (comandos):

*Comandos Gerais*
*$ajuda*: 🙋‍♂️ Mostra esta mensagem de ajuda.
*$infogrupo*: ℹ️ Mostra informações sobre o grupo atual (como o ID).
*$sticker*: Responda a uma imagem, GIF ou vídeo curto com este comando para criar uma figurinha.

*Comandos de Utilidade*
*$login*: 🔑 Mostra os IDs necessários para autorizar um usuário neste grupo.
*Comandos para Admins*
*$todos <mensagem>*: 📢 Menciona todos os membros do grupo com uma mensagem.
*$sorteiaTodos*: 🎲 Sorteia um membro do grupo.
*$sorteiaNumero <qtd> <limite>*: 🔢 Sorteia uma quantidade de números até um limite. Ex: \`$sorteiaNumero 3 50\`
*$enquete "Pergunta" "Opção 1" ...*: 📊 Cria uma enquete no grupo.
*$fecharGrupo*: 🔒 Fecha o grupo. Apenas admins podem enviar mensagens.
*$abrirGrupo*: 🔓 Abre o grupo para todos os membros.
*$lembrete <tempo> <unidade de tempo> "mensagem"*: ⏰ Agenda um lembrete para você. Ex: \`$lembrete 5 minutos "Comprar pão"\`

*$infouser [@membro]*: 👤 Mostra informações sobre você ou um membro mencionado.
*$remover @membro*: 👢 Remove um ou mais membros mencionados.
*$add <número>*: ➕ Adiciona um membro pelo número. Ex: \`$add 5521999998888\`

Fique de olho! 👀 Novas funcionalidades estão sempre a caminho! ✨`
    
    console.log("Enviando mensagem...");
    await message.reply(text)
    console.log("Mensagem enviada!");
    return
}

const sorteiaUm = async(message) => {
    if (!(await isAuthorized(message))) {
        return await message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const args = message.body.replace('$sorteiaNumero', '').trim().split(' ');

    if (args.length !== 2) {
        return await message.reply("Formato incorreto! Use: *$sorteiaNumero <quantidade> <limite>*.\nExemplo: `$sorteiaNumero 3 50` para sortear 3 números de 1 a 50.");
    }

    const quantidade = parseInt(args[0], 10);
    const limite = parseInt(args[1], 10);

    if (isNaN(quantidade) || isNaN(limite) || quantidade <= 0 || limite <= 0) {
        return await message.reply("Por favor, use números válidos e maiores que zero.");
    }

    if (quantidade > limite) {
        return await message.reply("A quantidade de números a sortear não pode ser maior que o limite.");
    }

    const numerosDisponiveis = Array.from({ length: limite }, (_, i) => i + 1);
    const numerosSorteados = [];

    for (let i = 0; i < quantidade; i++) {
        const indiceSorteado = Math.floor(Math.random() * numerosDisponiveis.length);
        const numeroSorteado = numerosDisponiveis.splice(indiceSorteado, 1)[0];
        numerosSorteados.push(numeroSorteado);
    }

    const textoSorteio = numerosSorteados.join(', ');
    const text = `🎲 Os ${quantidade} número(s) sorteado(s) entre 1 e ${limite} foram: *${textoSorteio}*!`;

    console.log("Enviando mensagem...");
    await message.reply(text);
    console.log("Mensagem enviada!");
}

const mentionEveryone = async(message, client) => {
    const chat = await message.getChat();
    console.log("Verificando se o autor é admin...");
    
    if (!(await isAuthorized(message))) {
        return await message.reply("❌ Apenas administradores podem usar este comando.");
    }

    console.log("Autor é admin. Prosseguindo com as menções...");
    const botId = client.info.wid._serialized;
    const participantsToMention = chat.groupMetadata.participants.filter(p => p.id._serialized !== botId);

    if (participantsToMention.length === 0) {
        return message.reply("Não há outros participantes para mencionar.");
    }

    console.log(`Encontrado ${participantsToMention.length} participantes para mencionar.`);

    const customText = message.body.replace('$todos', '').trim();
    const text = customText ? `📢 *Marcando geral!* 📢\n\n${customText}` : '📢 *Marcando geral!* 📢';

    // Divide as menções em blocos de 50 para evitar bloqueios e erros.
    const chunkSize = 100;
    const totalChunks = Math.ceil(participantsToMention.length / chunkSize);

    for (let i = 0; i < participantsToMention.length; i += chunkSize) {
        const chunk = participantsToMention.slice(i, i + chunkSize);
        // Use os IDs serializados diretamente para as menções, pois a API suporta isso e getContactById está falhando.
        // Use os IDs serializados diretamente para as menções, pois a API suporta isso e a obtenção de contatos está falhando.
        const mentions = chunk.map(p => p.id._serialized);
        const currentChunkNumber = Math.floor(i / chunkSize) + 1;

        // Na primeira mensagem, enviamos o texto principal. Nas seguintes, apenas as menções.
        const messageText = (i === 0) ? text : `Marcação ${currentChunkNumber}/${totalChunks}`;
        console.log(`Enviando bloco ${currentChunkNumber}/${totalChunks} com ${chunk.length} menções...`);
        await chat.sendMessage(messageText, { mentions });
        // Adiciona um pequeno atraso entre as mensagens para parecer mais natural.
        if (i + chunkSize < participantsToMention.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.log('Todas as menções foram enviadas com sucesso!');
}


const sorteiaTodos = async (message) => {
    const chat = await message.getChat();

    if(!(await isAuthorized(message))) return;

    let participantList = [];
    
    for(let participant of chat.participants){
        participantList.push(participant)
    }

    let number = Math.floor(Math.random() * participantList.length)
    let participantLucky = participantList[number]
    let text = `O participante sorteado foi: @${participantLucky.id.user}!\nParabéns heheheheh`

    console.log("Enviando mensagem...");
    
    let mentions = [participantLucky.id._serialized];
    await chat.sendMessage(text, { mentions });

    console.log("Mensagem enviada!");
}

const createSticker = async (message, client) =>{
    if(message.hasMedia){
        try {
            console.log("Baixando midia...")
            const media = await message.downloadMedia()

            console.log(`Midia baixada. MimeType: ${media.mimetype}`)
            await message.reply(media, undefined, {
                sendMediaAsSticker: true,
                stickerAuthor: "Criado pelo mEEEEEEEEEEEW",
                stickerName: 'sla dog'
            })

            console.log("Fig enviada com sucesso")
        } catch (e) {
            console.error("Erro ao criar sticker: ", e)
            await message.reply("❌ Ops! Não consegui criar o sticker. Tente com outra imagem, GIF ou vídeo curto.");
        }
    } else {
        await message.reply("Para criar um sticker, envie uma imagem, GIF ou vídeo curto com a legenda *$sticker*!");
    }

}

/**
 * Alterna as configurações do grupo para permitir que apenas administradores ou todos os membros enviem mensagens.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 */
const toggleGroupLock = async (message) => {
    if (!(await isAuthorized(message))) {
        return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const chat = await message.getChat();
    if (!chat.isGroup) {
        return message.reply("Este comando só funciona em grupos.");
    }

    const shouldLock = message.body.startsWith('$fecharGrupo');

    try {
        await chat.setMessagesAdminsOnly(shouldLock);
        const replyText = shouldLock 
            ? "🔒 Grupo fechado! Apenas administradores podem enviar mensagens." 
            : "🔓 Grupo aberto! Todos podem enviar mensagens novamente.";
        await message.reply(replyText);
    } catch (e) {
        console.error("Erro ao alterar as configurações do grupo:", e);
        message.reply("❌ Ops! Não consegui alterar as configurações do grupo.");
    }
};

/**
 * Adiciona um ou mais participantes a um grupo.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 */
const addParticipant = async (message) => {
    if (!(await isAuthorized(message))) {
        return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const chat = await message.getChat();
    if (!chat.isGroup) {
        return message.reply("Este comando só funciona em grupos.");
    }

    const numberToAdd = message.body.replace('$add', '').trim();
    if (!numberToAdd || !/^\d+$/.test(numberToAdd)) {
        return message.reply("Formato incorreto! Use: * <numero>*\nExemplo: ` 5521999998888`");
    }

    // Adiciona o sufixo @c.us que a API exige para IDs de usuário
    const participantId = `@c.us`;

    try {
        const result = await chat.addParticipants([participantId]);
        
        // A API retorna um objeto com o status para cada número
        if (result[participantId]?.code === 200) {
             await message.reply(`✅ Usuário adicionado com sucesso!`);
        } else {
             await message.reply(`❌ Não foi possível adicionar o usuário. Verifique o número ou se ele já está no grupo.`);
        }

    } catch (e) {
        console.error("Erro ao adicionar participante:", e);
        message.reply("❌ Ops! Não consegui adicionar o membro. Verifique se sou administrador e se o número está correto.");
    }
};
/**
 * Remove um ou mais participantes de um grupo.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 */
const removeParticipant = async (message) => {
    if (!(await isAuthorized(message))) {
        return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const chat = await message.getChat();
    if (!chat.isGroup) {
        return message.reply("Este comando só funciona em grupos.");
    }

    const participantsToRemove = message.mentionedIds;
    if (!participantsToRemove || participantsToRemove.length === 0) {
        return message.reply("Você precisa mencionar quem você quer remover. Use: *$remover @usuario*");
    }

    try {
        const result = await chat.removeParticipants(participantsToRemove);
        console.log('Resultado da remoção:', result);
        // A API pode retornar diferentes status, então uma mensagem genérica é mais segura.
        await message.reply(`✅ Solicitação para remover ${participantsToRemove.length} membro(s) enviada.`);

    } catch (e) {
        console.error("Erro ao remover participante(s):", e);
        message.reply("❌ Ops! Não consegui remover o(s) membro(s). Verifique se sou administrador do grupo.");
    }
};

/**
 * Define um lembrete para ser enviado após um tempo especificado.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 */
const setReminder = async (message) => {
    if (!(await isAuthorized(message))) {
        return message.reply("❌ Apenas administradores podem usar este comando.");
    }
    const commandRegex = /\$lembrete (\d+)\s+(segundo|segundos|minuto|minutos|hora|horas)\s+"(.*?)"/i;
    const match = message.body.match(commandRegex);

    const usageHelp = 'Formato incorreto! 🧐\nUse: *$lembrete <tempo> <unidade> "mensagem"*\n\n*Exemplos:*\n`$lembrete 10 segundos "Ligar para o Zé"`\n`$lembrete 5 minutos "Beber água"`\n`$lembrete 1 hora "Estudar programação"`';

    if (!match) {
        return message.reply(usageHelp);
    }

    const [, timeValue, timeUnit, reminderMessage] = match;
    const time = parseInt(timeValue, 10);

    let delayInMs;
    const unit = timeUnit.toLowerCase();

    if (unit.startsWith('segundo')) {
        delayInMs = time * 1000;
    } else if (unit.startsWith('minuto')) {
        delayInMs = time * 60 * 1000;
    } else if (unit.startsWith('hora')) {
        delayInMs = time * 60 * 60 * 1000;
    }

    if (isNaN(delayInMs) || delayInMs <= 0) {
        return message.reply("Por favor, forneça um tempo válido.");
    }
    
    // Confirma o agendamento para o usuário
    await message.reply(`✅ Lembrete agendado! Daqui a *${time} ${timeUnit}* eu vou te lembrar de: "${reminderMessage}"`);
    console.log(`Lembrete agendado por ${message.author} para daqui a ${delayInMs}ms.`);

    // Agenda o lembrete
    setTimeout(async () => {
        try {
            const chat = await message.getChat();
            const authorContact = await message.getContact();
            const reminderText = `⏰ *HORA DO LEMBRETE!* ⏰\n\nOlá, @${authorContact.id.user}! Você me pediu para te lembrar de:\n\n*_"${reminderMessage}"_*`;
            
            // Envia a mensagem mencionando o autor original
            await chat.sendMessage(reminderText, { mentions: [authorContact.id._serialized] });
            console.log(`Lembrete enviado para ${authorContact.id.user}.`);
        } catch (e) {
            console.error("Erro ao enviar o lembrete agendado:", e);
        }
    }, delayInMs);
};

/**
 * Envia informações sobre o grupo, incluindo seu ID.
 * @param {Message} message O objeto da mensagem.
 */
const infoGrupo = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        return message.reply("Este comando só funciona em grupos.");
    }

    const infoText = `*Informações do Grupo*

*Nome:* ${chat.name}
*ID:* \`${chat.id._serialized}\``;

    await message.reply(infoText);
};

/**
 * Envia informações sobre um usuário do grupo.
 * @param {Message} message O objeto da mensagem.
 */
const infoUser = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        // Em chat privado, só podemos pegar as informações básicas do autor.
        const author = await message.getContact();
        const infoText = `*Informações do Usuário*

*Nome:* ${author.pushname || 'Não definido'}
*ID:* \`${author.id._serialized}\`
*Número:* ${author.number || 'Não disponível'}`;
        return message.reply(infoText);
    }

    const mentions = await message.getMentions();
    const userToGet = mentions.length > 0 ? mentions[0] : await message.getContact();

    const participant = chat.participants.find(p => p.id._serialized === userToGet.id._serialized);

    const infoText = `*Informações do Usuário*

*Nome:* ${userToGet.pushname || 'Não definido'}
*ID:* \`${userToGet.id._serialized}\`
*É admin?* ${participant?.isAdmin || participant?.isSuperAdmin ? 'Sim ✅' : 'Não ❌'}`;

    await message.reply(infoText);
};

/**
 * Fornece os IDs do grupo e do usuário para facilitar a autorização manual.
 * @param {Message} message O objeto da mensagem.
 */
const login = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        return message.reply("Este comando só funciona em grupos.");
    }

    const groupId = chat.id._serialized;
    const userId = message.author || message.from;

    if (!userId) {
        return message.reply("❌ Não consegui identificar seu ID de usuário.");
    }

    // Informa no console sobre a tentativa de login
    console.log(`\n--- Solicitação de Autorização ---`);
    console.log(`Usuário: (${userId})`);
    console.log(`Grupo: ${chat.name} (${groupId})`);
    console.log(`Para autorização permanente, adicione o seguinte ao objeto 'AUTHORIZED_USERS' em functions.js:`);
    console.log(`'${groupId}': ['${userId}'],`);
    console.log(`----------------------------------\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(`Deseja autorizar o usuário "${userId}" no grupo "${chat.name}" para a sessão atual? (s/n) `, async (answer) => {
        if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
            if (!AUTHORIZED_USERS[groupId]) {
                AUTHORIZED_USERS[groupId] = [];
            }
            if (!AUTHORIZED_USERS[groupId].includes(userId)) {
                AUTHORIZED_USERS[groupId].push(userId);
                console.log(`✅ Usuário (${userId}) autorizado para o grupo ${chat.name} nesta sessão.`);
                await message.reply("✅ Você foi autorizado com sucesso para usar os comandos de admin neste grupo nesta sessão!");
            } else {
                console.log(`ℹ️ Usuário (${userId}) já estava autorizado para o grupo ${chat.name}.`);
                await message.reply("ℹ️ Você já tem autorização neste grupo.");
            }
        } else {
            console.log(`❌ Autorização para (${userId}) negada.`);
            await message.reply("❌ Seu pedido de autorização foi negado.");
        }
        rl.close();
    });
};

/**
 * Envia uma mensagem para um grupo específico a partir de um chat privado com o dono.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 * @param {Client} client O objeto do cliente.
 */
const sendMessageToGroup = async (message, client) => {
    // 1. Verificação de segurança: Apenas o dono pode usar este comando.
    if (!OWNER_ID.includes(message.from)) {
        return message.reply("❌ Você não tem permissão para usar este comando.");
    }

    // 2. Regex para extrair o ID do grupo e a mensagem.
    // Ex: $enviar 12345-6789@g.us "Olá, grupo!"
    const commandRegex = /\$enviar\s+([\w-]+@g\.us)\s+"(.*?)"/s;
    const match = message.body.match(commandRegex);
    const usageHelp = 'Formato incorreto! 🧐\nUse: *$enviar <ID do Grupo> "Sua mensagem"*';

    if (!match) {
        return message.reply(usageHelp);
    }

    const [, groupId, messageToSend] = match;

    try {
        // 3. Verifica se o grupo existe.
        const chat = await client.getChatById(groupId);
        if (!chat || !chat.isGroup) {
            return message.reply(`❌ Não encontrei um grupo com o ID: ${groupId}`);
        }

        // 4. Envia a mensagem para o grupo.
        await chat.sendMessage(messageToSend);
        await message.reply(`✅ Mensagem enviada com sucesso para o grupo *${chat.name}*!`);
        console.log(`Mensagem enviada para ${chat.name} a pedido do dono.`);

    } catch (e) {
        console.error("Erro ao enviar mensagem para o grupo:", e);
        await message.reply("❌ Ops! Tive um problema ao tentar enviar a mensagem.");
    }
};

/**
 * Envia uma enquete para um grupo específico a partir de um chat privado com o dono.
 * @param {Message} message O objeto da mensagem que acionou o comando.
 * @param {Client} client O objeto do cliente.
 */
const sendPollToGroup = async (message, client) => {
    // 1. Verificação de segurança: Apenas o dono pode usar este comando.
    if (!OWNER_ID.includes(message.from)) {
        return message.reply("❌ Você não tem permissão para usar este comando.");
    }

    // 2. Regex para extrair o ID do grupo e todo o conteúdo da enquete.
    const commandRegex = /^\$enqueteGrupo\s+([\w-]+@g\.us)\s+((?:"[^"]+"\s*)+)/i;
    const match = message.body.match(commandRegex);

    const usageHelp = 'Formato incorreto! 🧐\nUse: *$enqueteGrupo <ID do Grupo> "Pergunta" "Opção 1" ...*';

    if (!match) {
        return message.reply(usageHelp);
    }
    
    const groupId = match[1]; // Captura o ID do grupo
    const pollContent = match[2]; // Captura a parte com a pergunta e as opções
    const pollData = pollContent.match(/"(.*?)"/g)?.map(s => s.replace(/"/g, ''));
    
    if (!pollData || pollData.length < 2) {
        return message.reply(usageHelp);
    }

    const [question, ...options] = pollData;

    try {
        // 3. Verifica se o grupo existe.
        const chat = await client.getChatById(groupId);
        if (!chat || !chat.isGroup) {
            return message.reply(`❌ Não encontrei um grupo com o ID: ${groupId}`);
        }

        // 4. Envia a enquete para o grupo.
        await chat.sendMessage(new Poll(question, options));
        await message.reply(`✅ Enquete enviada com sucesso para o grupo *${chat.name}*!`);
        console.log(`Enquete enviada para ${chat.name} a pedido do dono.`);
    } catch (e) {
        console.error("Erro ao enviar enquete para o grupo:", e);
        await message.reply("❌ Ops! Tive um problema ao tentar enviar a enquete.");
    }
};

module.exports = {
    createPoll,
    isAuthorized,
    helpMe,
    sorteiaUm,
    mentionEveryone,
    sorteiaTodos,
    createSticker,
    toggleGroupLock,
    addParticipant,
    removeParticipant,
    setReminder,
    infoGrupo,
    sendMessageToGroup,
    sendPollToGroup,
    infoUser,
    login
};
