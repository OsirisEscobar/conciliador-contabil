// src/components/Menu.jsx
import React from 'react';

const Menu = ({ onNavigate }) => {
    return (
        <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Suíte de Conciliação Contábil</h1>
            <p className="text-gray-500 mt-2 mb-10">Escolha uma ferramenta para começar a mágica.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => onNavigate('fornecedores_winthor')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-indigo-600">Fornecedores (Winthor)</h2>
                    <p className="text-gray-500 mt-2">Concilie compras e pagamentos no padrão Winthor.</p>
                </div>
                 <div onClick={() => onNavigate('fornecedores_dominio')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-indigo-800">Fornecedores (Domínio)</h2>
                    <p className="text-gray-500 mt-2">Concilie compras e pagamentos no padrão Domínio.</p>
                </div>
                <div onClick={() => onNavigate('clientes_winthor')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-teal-600">Clientes (Winthor)</h2>
                    <p className="text-gray-500 mt-2">Verifique vendas e recebimentos no padrão Winthor.</p>
                </div>
                 <div onClick={() => onNavigate('clientes_dominio')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-teal-800">Clientes (Domínio)</h2>
                    <p className="text-gray-500 mt-2">Verifique vendas e recebimentos no padrão Domínio.</p>
                </div>
                 <div onClick={() => onNavigate('impostos_winthor')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-red-600">Impostos (Winthor)</h2>
                    <p className="text-gray-500 mt-2">Concilie guias e provisões no padrão Winthor.</p>
                </div>
                 <div onClick={() => onNavigate('impostos_dominio')} className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <h2 className="text-xl font-bold text-red-800">Impostos (Domínio)</h2>
                    <p className="text-gray-500 mt-2">Apure tributos no layout Domínio sem mesclagem.</p>
                </div>
            </div>
        </div>
    );
};

export default Menu;