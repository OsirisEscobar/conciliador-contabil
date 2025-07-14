import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';

// Pega a chave publicável da variável de ambiente que configuramos na Vercel.
// Este é o jeito seguro e profissional.
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Uma verificação de segurança para garantir que a chave foi encontrada.
if (!PUBLISHABLE_KEY) {
  throw new Error("Faltando a Chave Publicável do Clerk (Missing Publishable Key)");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* O ClerkProvider "envelopa" todo o seu app,
        dando a ele os superpoderes de autenticação. */}
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);