// src/components/Reconciler.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Importamos a biblioteca de Excel aqui!

// Importamos nossas próprias funções do "cérebro"
import { getRandomPhrase, formatDate, parseCurrency, extractId, analyzeInstallments } from '../utils/helpers.js';
import DetailsModal from './DetailsModal.jsx'; // Importamos o componente do Modal

const Reconciler = ({ config, onBackToMenu }) => {
    const [filesToProcess, setFilesToProcess] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [reconciliationData, setReconciliationData] = useState({});
    const [uiPhrases, setUiPhrases] = useState({});

    useEffect(() => {
        setUiPhrases({
            title: getRandomPhrase('title'),
            subtitle: getRandomPhrase('subtitle'),
            dropzoneTitle: getRandomPhrase('dropzoneTitle'),
            dropzoneSubtitle: getRandomPhrase('dropzoneSubtitle'),
            loading: getRandomPhrase('loading'),
            verdict: getRandomPhrase('verdict'),
            finalBalance: getRandomPhrase('finalBalance'),
            openItems: getRandomPhrase('openItems'),
            unmatchedItems: getRandomPhrase('unmatchedItems')
        });
    }, []);

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    };

    const handleFiles = (files) => {
        setFilesToProcess(Array.from(files));
    };

    const findHeaderMapping = (json) => {
        const headerKeywords = {
            date: ['data'],
            description: ['histórico', 'historico', 'histórico completo'],
            debit: ['débito', 'debito'],
            credit: ['crédito', 'credito'],
            balance: ['saldo']
        };

        for (let i = 0; i < Math.min(json.length, 20); i++) {
            const row = json[i];
            if (!row || !Array.isArray(row) || row.length < 3) continue;
            
            const mapping = {};
            let foundCount = 0;
            
            for (const key in headerKeywords) {
                for (const keyword of headerKeywords[key]) {
                    const index = row.findIndex(cell => typeof cell === 'string' && cell.toLowerCase().trim().includes(keyword));
                    if (index !== -1) {
                        if (!mapping[key]) {
                            mapping[key] = index;
                            foundCount++;
                        }
                    }
                }
            }
            
            if (foundCount >= 4 && mapping.hasOwnProperty('date') && mapping.hasOwnProperty('debit') && mapping.hasOwnProperty('credit') && mapping.hasOwnProperty('description')) {
                mapping.headerRowIndex = i;
                return mapping;
            }
        }
        return null;
    }

    const parseExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
                    
                    let mapping;
                    if (config.parser === 'winthor_fixed') {
                        mapping = { date: 3, description: 6, debit: 7, credit: 8, balance: 9, headerRowIndex: 0 };
                    } else {
                        mapping = findHeaderMapping(json);
                    }

                    if (!mapping) {
                       throw new Error("Não foi possível identificar o cabeçalho do arquivo. Verifique se as colunas 'Data', 'Histórico', 'Débito' e 'Crédito' existem.");
                    }

                    let initialBalance = 0;
                    const dataRows = json.slice(mapping.headerRowIndex + 1);

                    const saldoRow = dataRows.find(row => row && String(row[mapping.description]).toLowerCase().includes('saldo anterior'));
                    if (saldoRow && mapping.hasOwnProperty('balance')) {
                        initialBalance = parseCurrency(saldoRow[mapping.balance]);
                    } else {
                         const firstRow = dataRows.find(row => row && row[mapping.date]);
                         if (firstRow && mapping.hasOwnProperty('balance')) {
                             const firstRowBalanceStr = String(firstRow[mapping.balance] || '0').toUpperCase();
                             const firstRowDebit = parseCurrency(firstRow[mapping.debit]);
                             const firstRowCredit = parseCurrency(firstRow[mapping.credit]);
                             const balanceValue = parseCurrency(firstRowBalanceStr);
                             if (firstRowBalanceStr.includes('C')) {
                                 initialBalance = balanceValue + firstRowDebit - firstRowCredit;
                             } else if (firstRowBalanceStr.includes('D')) {
                                 initialBalance = balanceValue - firstRowDebit + firstRowCredit;
                             }
                         }
                    }

                    const transactions = dataRows.map(row => {
                        if (!row) return null;
                        const date = formatDate(row[mapping.date]);
                        const description = row[mapping.description] ? String(row[mapping.description]).trim() : '';
                        const transactionId = extractId(description, config);
                        const debit = parseCurrency(row[mapping.debit]);
                        const credit = parseCurrency(row[mapping.credit]);

                        if (date && description && (debit > 0 || credit > 0)) {
                            return { date, description, debit, credit, transactionId };
                        }
                        return null;
                    }).filter(Boolean);
                    
                    resolve({ transactions, initialBalance });
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    const reconcile = (transactions, initialBalance = 0) => {
        const localReconData = {};
        let totalCreditPeriod = 0;
        let totalDebitPeriod = 0;

        transactions.forEach(t => {
            totalCreditPeriod += t.credit;
            totalDebitPeriod += t.debit;
        });
        
        const provisionField = config.provisionField;
        const paymentField = config.paymentField;

        const provisionedIds = new Set(transactions.filter(t => t[provisionField] > 0 && t.transactionId).map(t => t.transactionId));
        let orphanPayments = transactions.filter(t => t[paymentField] > 0 && !provisionedIds.has(t.transactionId));
        const matchedTransactions = transactions.filter(t => t.transactionId);

        matchedTransactions.forEach(t => {
            if (!localReconData[t.transactionId]) {
                localReconData[t.transactionId] = { id: t.transactionId, totalDebit: 0, totalCredit: 0, allTransactions: [] };
            }
            localReconData[t.transactionId].totalDebit += t.debit;
            localReconData[t.transactionId].totalCredit += t.credit;
            localReconData[t.transactionId].allTransactions.push(t);
        });
        
        if (initialBalance > 0.01) {
            const sumOrphanPayments = orphanPayments.reduce((sum, p) => sum + p[paymentField], 0);
            
            if (Math.abs(sumOrphanPayments - initialBalance) < 0.01) {
                const initialTransaction = { date: 'Período Anterior', description: 'Saldo Inicial', credit: config.id.includes('fornecedores') || config.id.includes('impostos') ? initialBalance : 0, debit: config.id.includes('clientes') ? initialBalance : 0 };
                localReconData['SALDO INICIAL'] = {
                    id: 'SALDO INICIAL',
                    totalCredit: initialTransaction.credit + orphanPayments.reduce((s, p) => s + p.credit, 0),
                    totalDebit: initialTransaction.debit + orphanPayments.reduce((s, p) => s + p.debit, 0),
                    allTransactions: [ initialTransaction, ...orphanPayments ]
                };
                orphanPayments = [];
            } else {
                localReconData['SALDO INICIAL'] = {
                    id: 'SALDO INICIAL',
                    totalCredit: config.id.includes('fornecedores') || config.id.includes('impostos') ? initialBalance : 0,
                    totalDebit: config.id.includes('clientes') ? initialBalance : 0,
                    allTransactions: [{ date: 'Período Anterior', description: 'Saldo Inicial', credit: config.id.includes('fornecedores') || config.id.includes('impostos') ? initialBalance : 0, debit: config.id.includes('clientes') ? initialBalance : 0 }]
                };
            }
        }

        const openProvisions = [];
        for (const id in localReconData) {
            const group = localReconData[id];
            const balance = config.provisionField === 'credit' ? group.totalCredit - group.totalDebit : group.totalDebit - group.totalCredit;
            if (balance > 0.01) {
                const provision = group.allTransactions.find(t => t[provisionField] > 0) || group.allTransactions[0];
                openProvisions.push({ id, balance, totalCredit: group.totalCredit, totalDebit: group.totalDebit, date: provision?.date || 'N/A' });
            }
        }
        
        setReconciliationData(localReconData);
        
        let finalBalance = 0;
        if (config.id.includes('fornecedores') || config.id.includes('impostos')) {
            finalBalance = initialBalance + totalCreditPeriod - totalDebitPeriod;
        } else {
            finalBalance = initialBalance + totalDebitPeriod - totalCreditPeriod;
        }

        setResults({
            openProvisions,
            unmatchedPayments: orphanPayments,
            finalBalance: finalBalance
        });
    };
    
    const handleReconcileClick = async () => {
        if (filesToProcess.length === 0) return;
        setIsLoading(true);
        setUiPhrases(prev => ({ ...prev, loading: getRandomPhrase('loading') }));
        setResults(null);
        
        let allData = { transactions: [], initialBalance: 0 };
        for (const file of filesToProcess) {
            try {
                const parsedData = await parseExcel(file);
                allData.transactions.push(...parsedData.transactions);
                if (parsedData.initialBalance !== 0 && allData.initialBalance === 0) {
                    allData.initialBalance = parsedData.initialBalance;
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                alert(`Não foi possível processar o arquivo ${file.name}. Verifique o formato e tente novamente. Erro: ${error.message}`);
            }
        }
        
        reconcile(allData.transactions, allData.initialBalance);
        setIsLoading(false);
    };

    const downloadCSV = () => {
        if(!results) return;
        let csvContent = "";
        
        csvContent += "PROVISOES COM SALDO EM ABERTO\r\n";
        csvContent += "Data,Documento,Valor,Observacoes\r\n";
        results.openProvisions.forEach(item => {
            let obs = '';
            if (item.id === 'SALDO INICIAL') {
                obs = 'Saldo vindo do período anterior.';
            } else if (reconciliationData[item.id]) {
                obs = analyzeInstallments(reconciliationData[item.id], config);
            }
            const row = [item.date, item.id, item.balance.toFixed(2).replace('.',','), `"${obs.replace(/"/g, '""')}"`];
            csvContent += row.join(',') + '\r\n';
        });

        csvContent += "\r\n";
        csvContent += "PAGAMENTOS SEM PROVISAO CORRESPONDENTE\r\n";
        csvContent += "Data,Historico,Valor,Observacoes\r\n";
        results.unmatchedPayments.forEach(item => {
            const obs = `Pagamento nao vinculado a nenhuma NF ou ao Saldo Inicial.`;
            const row = [item.date, `"${item.description.replace(/"/g, '""')}"`, item[config.paymentField].toFixed(2).replace('.',','), `"${obs}"`];
            csvContent += row.join(',') + '\r\n';
        });

        csvContent += "\r\n";
        csvContent += `SALDO FINAL DO RAZAO,${results.finalBalance.toFixed(2).replace('.',',')}\r\n`;

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_${config.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full">
            <button onClick={onBackToMenu} className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium">&larr; Voltar ao Menu</button>
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{config.title}</h1>
                <p className="text-gray-500 mt-2">{config.subtitle}</p>
            </div>

            <div id="drop-zone" onDrop={handleFileDrop} onDragOver={(e) => e.preventDefault()} onDragEnter={(e) => e.currentTarget.classList.add('drag-over')} onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')} className="drop-zone relative flex flex-col items-center justify-center p-10 rounded-xl text-center cursor-pointer hover:bg-gray-50">
                <svg className="w-16 h-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <p className="font-semibold text-gray-700">{uiPhrases.dropzoneTitle}</p>
                <p className="text-sm text-gray-500 mt-1">{uiPhrases.dropzoneSubtitle}</p>
                <input type="file" id="file-input" onChange={(e) => handleFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple accept=".xls,.xlsx,.csv" />
            </div>

            {filesToProcess.length > 0 && (
                <div className="mt-6 text-center">
                    <p className="font-medium text-gray-800">Arquivos na mira:</p>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">{filesToProcess.map(f => <p key={f.name} className="truncate">{f.name}</p>)}</div>
                    <button onClick={handleReconcileClick} className="mt-6 w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">Fazer a Mágica!</button>
                </div>
            )}

            {isLoading && (
                <div className="text-center my-8">
                    <div className="spinner w-12 h-12 rounded-full border-4 border-gray-200 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">{uiPhrases.loading}</p>
                </div>
            )}

            {results && (
                <div className="mt-10">
                    <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-800">{uiPhrases.verdict}</h2></div>
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row justify-between items-center">
                        <div>
                            <p className="text-gray-600">{uiPhrases.finalBalance}</p>
                            <p className={`text-2xl font-bold ${results.finalBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{results.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <button onClick={downloadCSV} className="mt-4 sm:mt-0 w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105">Baixar Provas (CSV)</button>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{uiPhrases.openItems}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NF / Documento</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Valor Pendente (R$)</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Observações do Detetive</th></tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {results.openProvisions.sort((a, b) => (a.date === 'Período Anterior' ? -1 : b.date === 'Período Anterior' ? 1 : new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')))).map(item => (
                                        <tr key={item.id} onClick={() => setModalData(reconciliationData[item.id])} className="hover:bg-gray-50 clickable-row">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{item.id}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.balance > 0 ? 'text-red-600' : 'text-blue-600'} font-semibold`}>{item.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.id === 'SALDO INICIAL' ? 'Saldo vindo do período anterior.' : analyzeInstallments(reconciliationData[item.id], config)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {results.openProvisions.length === 0 && <p className="text-center text-gray-500 py-6">Parabéns! Nenhum centavo foragido por aqui.</p>}
                    </div>

                    <div className="mt-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{uiPhrases.unmatchedItems}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data do Pagamento</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Histórico</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Valor (R$)</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Observações</th></tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {results.unmatchedPayments.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{item[config.paymentField].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">Pagamento não vinculado a nenhuma NF ou ao Saldo Inicial.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {results.unmatchedPayments.length === 0 && <p className="text-center text-gray-500 py-6">Incrivelmente, todos os pagamentos encontraram seu par!</p>}
                    </div>
                </div>
            )}
            <DetailsModal isOpen={!!modalData} onClose={() => setModalData(null)} data={modalData} config={config} />
        </div>
    );
};

export default Reconciler;