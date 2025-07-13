// src/components/DetailsModal.jsx
import React from 'react';

const DetailsModal = ({ isOpen, onClose, data, config }) => {
    if (!isOpen || !data) return null;

    const { id, allTransactions, totalCredit, totalDebit } = data;
    const balance = config.provisionField === 'credit' ? totalCredit - totalDebit : totalDebit - totalCredit;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 modal">
            <div className="modal-content bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Auditoria da Conciliação</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-gray-600 mb-4">Documento: <span className="font-bold">{id}</span></p>
                <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Data</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Histórico</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Débito (R$)</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Crédito (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allTransactions.map((t, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-sm text-gray-700">{t.date}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{t.description}</td>
                                    <td className={`px-4 py-2 text-sm text-right font-mono ${t.debit > 0 ? 'text-blue-600' : ''}`}>{t.debit > 0 ? t.debit.toFixed(2) : ''}</td>
                                    <td className={`px-4 py-2 text-sm text-right font-mono ${t.credit > 0 ? 'text-green-600' : ''}`}>{t.credit > 0 ? t.credit.toFixed(2) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 pt-4 border-t text-right">
                    <p>Total Provisionado: <span className="font-bold">{config.provisionField === 'credit' ? totalCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : totalDebit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                    <p>Total Pago/Recebido: <span className="font-bold">{config.paymentField === 'debit' ? totalDebit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : totalCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                    <p className="text-xl font-bold mt-2">Saldo em Aberto: <span className={balance > 0 ? 'text-red-600' : 'text-blue-600'}>{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;