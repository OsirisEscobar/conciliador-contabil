// Conteúdo para: src/App.jsx
import React, { useState } from 'react';
import Menu from './components/Menu.jsx';
import Reconciler from './components/Reconciler.jsx';
import './index.css';

function App() {
    const [page, setPage] = useState('menu');
    const configs = {
        fornecedores_dominio: { id: 'fornecedores_dominio', title: 'Conciliador de Fornecedores (Domínio)', subtitle: 'Vamos ver quem você está devendo...', provisionField: 'credit', paymentField: 'debit', idType: 'nf', parser: 'auto' },
        clientes_dominio: { id: 'clientes_dominio', title: 'Conciliador de Clientes (Domínio)', subtitle: 'Hora de cobrar a galera!', provisionField: 'debit', paymentField: 'credit', idType: 'nf', parser: 'auto' },
        impostos_dominio: { id: 'impostos_dominio', title: 'Conciliador de Impostos (Domínio)', subtitle: 'Apuração de tributos sem estresse.', provisionField: 'credit', paymentField: 'debit', idType: 'competence', parser: 'auto' }
    };

    const renderPage = () => {
        if (configs[page]) {
            return <Reconciler config={configs[page]} onBackToMenu={() => setPage('menu')} />;
        }
        return <Menu onNavigate={setPage} />;
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <main className="bg-white w-full max-w-5xl mx-auto p-6 sm:p-8 rounded-2xl shadow-lg">
                {renderPage()}
            </main>
            <footer className="w-full text-center py-4">
                <p className="text-sm text-gray-400 font-medium">
                    Desenvolvido por Osiris Escobar
                </p>
            </footer>
        </div>
    );
}
export default App;