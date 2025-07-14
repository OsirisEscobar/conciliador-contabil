// Conteúdo final para: src/App.jsx

import React from 'react';
import Menu from './components/Menu.jsx';
import Reconciler from './components/Reconciler.jsx';
import './index.css';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

function App() {
    const [page, setPage] = React.useState('menu');

    // As configurações para cada tipo de conciliação
    const configs = {
        fornecedores_dominio: { id: 'fornecedores_dominio', title: 'Conciliador de Fornecedores (Domínio)', subtitle: 'Vamos ver quem você está devendo...', provisionField: 'credit', paymentField: 'debit', idType: 'nf', parser: 'auto' },
        clientes_dominio: { id: 'clientes_dominio', title: 'Conciliador de Clientes (Domínio)', subtitle: 'Hora de cobrar a galera!', provisionField: 'debit', paymentField: 'credit', idType: 'nf', parser: 'auto' },
        impostos_dominio: { id: 'impostos_dominio', title: 'Conciliador de Impostos (Domínio)', subtitle: 'Apuração de tributos sem estresse.', provisionField: 'credit', paymentField: 'debit', idType: 'competence', parser: 'auto' }
    };

    // Função que decide qual componente mostrar na tela
    const renderPage = () => {
        if (configs[page]) {
            return <Reconciler config={configs[page]} onBackToMenu={() => setPage('menu')} />;
        }
        return <Menu onNavigate={setPage} />;
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <header className="w-full max-w-5xl mx-auto flex justify-end p-4 absolute top-0 right-0">
                {/* Este botão mostra o avatar e a opção de sair para quem está logado */}
                <SignedIn>
                    <UserButton afterSignOutUrl="/"/>
                </SignedIn>
                {/* Este botão aparece para quem NÃO está logado */}
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                            Fazer Login
                        </button>
                    </SignInButton>
                </SignedOut>
            </header>

            {/* O conteúdo principal do seu app */}
            <main className="bg-white w-full max-w-5xl mx-auto p-6 sm:p-8 rounded-2xl shadow-lg">
                {/* Só mostra o menu/reconciliador se o usuário estiver logado */}
                <SignedIn>
                    {renderPage()}
                </SignedIn>
                {/* Mostra uma tela de boas-vindas se não estiver logado */}
                <SignedOut>
                   <div className="text-center py-20">
                        <h1 className="text-4xl font-bold text-gray-800">Bem-vindo ao Conciliador Contábil</h1>
                        <p className="text-gray-500 mt-4">Faça login para começar a organizar suas finanças.</p>
                   </div>
                </SignedOut>
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