// ...
import { ClerkProvider } from '@clerk/clerk-react';

// --- ATENÇÃO: COLOQUE SUA CHAVE AQUI ---
const PUBLISHABLE_KEY = "pk_test_bmV4dC1oZW4tMC5jbGVyay5hY2NvdW50cy5kZXYk"; // <-- SUA CHAVE AQUI

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);