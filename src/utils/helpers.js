// src/utils/helpers.js

// --- BANCO DE FRASES BEM HUMORADAS ---
const phrases = {
    title: [ "Conciliador Mágico (Quase!)", "O Exterminador de Diferenças", "Tira-Teima Contábil", "Onde a Conta Fecha (ou não)", "Desvendando o Razão", "Operação Saldo Zero", "Razão x Emoção", "O Senhor dos Lançamentos", "Ativo vs Passivo: A Batalha Final" ],
    subtitle: [ "Onde débitos e créditos finalmente fazem as pazes.", "Se não bater, a culpa é do sistema anterior.", "Transformando caos contábil em planilhas organizadas.", "Mais eficiente que um estagiário com café.", "Conciliando mais rápido que a Receita Federal te notifica.", "Sua planilha nunca mais será a mesma.", "Fazendo o balancete bater desde 2024." ],
    dropzoneTitle: [ "Jogue seus extratos aqui!", "Alimente o monstro da conciliação!", "Pode soltar a planilha do terror.", "Arraste o problema pra cá."],
    dropzoneSubtitle: [ "Prometemos não contar pra ninguém a bagunça.", "Sem julgamentos, só resultados.", "Vamos dar um jeito nisso.", "Confia na planilha." ],
    loading: [ "Cruzando dados... Tomando um cafezinho...", "Analisando os hieróglifos do seu extrato...", "Consultando os astros da contabilidade...", "Alinhando os chakras financeiros...", "Fazendo mais contas que a calculadora do celular.", "Procurando diferenças como se fosse o Wally." ],
    verdict: ["O Veredito do Tira-Teima Contábil!", "A verdade por trás dos números!", "Resultado da Autópsia Financeira:", "E o resultado do exame é..."],
    finalBalance: ["Saldo Final (Após o apocalipse):", "O que sobrou no caixa:", "Resumo da ópera:", "Situação final da conta:"],
    openItems: ["Débitos em Fuga (Itens em Aberto)", "Contas a acertar (com urgência!)", "Créditos esperando um milagre:", "Onde foi parar o dinheiro?"],
    unmatchedItems: ["Pagamentos Fantasmas (Sem Provisão)", "Lançamentos Misteriosos", "Débitos sem pai nem mãe:", "De onde veio esse pagamento?"]
};

export const getRandomPhrase = (category) => {
    const categoryPhrases = phrases[category];
    return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
};

export const formatDate = (dateInput) => {
    if (!dateInput) return '';
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return 'Data Inválida';
        return dateInput.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    if (typeof dateInput === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateInput)) {
        return dateInput;
    }
    return 'Data Inválida';
};

export const parseCurrency = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return 0;
    let strValue = String(value).replace(/[A-Z\s$]/g, '').trim();
    if (strValue.match(/(\d\.\d{3},\d{2})$/)) {
        strValue = strValue.replace(/\./g, '').replace(',', '.');
    } else {
        strValue = strValue.replace(/,/g, '.'); // Alterado para sempre usar ponto como decimal
    }
    return parseFloat(strValue) || 0;
};

export const extractId = (text, config) => {
    if (!text) return null;
    let match;
    if (config.idType === 'competence') {
        match = String(text).match(/(\d{2}\/\d{2,4})/);
    } else {
        match = String(text).match(/\b(\d{5,})\b/);
    }
    return match ? match[1] : null;
};

export const analyzeInstallments = (group, config) => {
    if (!group || !group.allTransactions) return "Dados insuficientes para análise.";
    
    const provisionField = config.provisionField;
    const paymentField = config.paymentField;

    const payments = group.allTransactions.filter(t => t[paymentField] > 0).sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));
    const provision = group.allTransactions.find(t => t[provisionField] > 0);
    
    if (!provision) return `Anomalia: Grupo sem provisão.`;
    if (payments.length === 0) return `Provisão de ${(provision[provisionField] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem pagamentos.`;

    const provisionValue = provision[provisionField];
    const significantPayments = payments.filter(p => p[paymentField] > provisionValue * 0.05);
    const avgPayment = significantPayments.length > 0 ? significantPayments.reduce((sum, p) => sum + p[paymentField], 0) / significantPayments.length : 0;

    if (avgPayment === 0) return `Provisão de ${group.totalCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com pagamento de ${group.totalDebit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;

    const expectedInstallments = Math.round(provisionValue / avgPayment);
    
    for (let i = 0; i < payments.length - 1; i++) {
        const date1 = new Date(payments[i].date.split('/').reverse().join('-'));
        const date2 = new Date(payments[i+1].date.split('/').reverse().join('-'));
        const monthDiff = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
        if (monthDiff > 1) {
            const missingMonth = new Date(date1.setMonth(date1.getMonth() + 1));
            const monthName = missingMonth.toLocaleString('pt-BR', { month: 'long' });
            return `Alerta de calote! Possível falta de pagamento em ${monthName}/${missingMonth.getFullYear()}.`;
        }
    }
    
    const balance = config.provisionField === 'credit' ? group.totalCredit - group.totalDebit : group.totalDebit - group.totalCredit;
    if (payments.length < expectedInstallments && balance > avgPayment * 0.5) return `Tudo certo por aqui. A(s) próxima(s) parcela(s) deve(m) vir no período seguinte.`;

    return `Provisão de ${group.totalCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com pagamento de ${group.totalDebit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
};