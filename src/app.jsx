import React, { useState, useEffect } from 'react';
import { Plus, Users, ShoppingCart, Package, Trash2, Save, Minus, DollarSign, Home, X, Loader2, LogOut } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
// PARA O VERCEL: Substitua os valores abaixo pelos dados do seu projeto Firebase (Passo 4 do guia)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBC2AqTBp712u1kol1BF17p_92WajvqMN0",
  authDomain: "docegestao-d887e.firebaseapp.com",
  projectId: "docegestao-d887e",
  storageBucket: "docegestao-d887e.firebasestorage.app",
  messagingSenderId: "488336019522",
  appId: "1:488336019522:web:0d15ff0d7b05f54e46dddb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Se estiver rodando no Vercel, usa um ID fixo, se for no preview, usa o ID do ambiente
const appId = typeof __app_id !== 'undefined' ? __app_id : 'doce-gestao-app';

// --- COMPONENTES UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-pink-100 p-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, loading = false }) => {
  const variants = {
    primary: "bg-pink-500 hover:bg-pink-600 text-white",
    secondary: "bg-purple-500 hover:bg-purple-600 text-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "text-gray-500 hover:bg-gray-100"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  // --- ESTADOS ---
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dados do Firestore
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesLog, setSalesLog] = useState([]);

  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Formulários e Ações
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '' });
  const [cart, setCart] = useState([]);
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState('');
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // --- FIREBASE: AUTENTICAÇÃO ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FIREBASE: LEITURA DE DADOS ---
  useEffect(() => {
    if (!user) return;

    // Referência base para os dados deste usuário específico
    // Estrutura: /artifacts/{appId}/users/{userId}/{collection}
    const basePath = (coll) => collection(db, 'artifacts', appId, 'users', user.uid, coll);

    // 1. Produtos
    const unsubProducts = onSnapshot(basePath('products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenação simples em memória
      setProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => console.error("Erro ao carregar produtos:", error));

    // 2. Clientes
    const unsubCustomers = onSnapshot(basePath('customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => console.error("Erro ao carregar clientes:", error));

    // 3. Vendas (Log)
    const unsubSales = onSnapshot(basePath('sales'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por data (mais recente primeiro)
      setSalesLog(data.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
    }, (error) => console.error("Erro ao carregar vendas:", error));

    return () => {
      unsubProducts();
      unsubCustomers();
      unsubSales();
    };
  }, [user]);

  // --- LÓGICA DE NEGÓCIO ---

  const formatMoney = (value) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Gerenciar Produtos
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setProcessing(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'products'), {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', price: '', stock: '' });
      setIsProductModalOpen(false);
    } catch (e) {
      alert("Erro ao salvar produto");
    }
    setProcessing(false);
  };

  const deleteProduct = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', id));
    }
  };

  const updateStock = async (item, amount) => {
    const newStock = Math.max(0, item.stock + amount);
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', item.id), {
      stock: newStock
    });
  };

  // Gerenciar Clientes
  const addCustomer = async () => {
    if (!newCustomer.name) return;
    setProcessing(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'customers'), {
        name: newCustomer.name,
        balance: 0,
        createdAt: serverTimestamp()
      });
      setNewCustomer({ name: '' });
      setIsCustomerModalOpen(false);
    } catch (e) {
      alert("Erro ao salvar cliente");
    }
    setProcessing(false);
  };

  const deleteCustomer = async (id) => {
    if (confirm('Excluir cliente? O histórico de dívida será perdido.')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customers', id));
    }
  };

  // Vendas
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const finalizeSale = async () => {
    if (cart.length === 0 || !selectedCustomerForSale) {
      alert("Selecione um cliente e adicione produtos.");
      return;
    }
    setProcessing(true);
    
    try {
      // 1. Atualizar Estoque (Iterativo pois Batch pode ser complexo em algumas regras de Firestore)
      for (const item of cart) {
        const productRef = doc(db, 'artifacts', appId, 'users', user.uid, 'products', item.id);
        // Pegamos o item atual da lista `products` (estado local atualizado pelo snapshot) para garantir consistência visual
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
             await updateDoc(productRef, {
                stock: Math.max(0, currentProduct.stock - item.qty)
            });
        }
      }

      // 2. Atualizar Dívida do Cliente
      const customer = customers.find(c => c.id === selectedCustomerForSale);
      if (customer) {
        const customerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'customers', selectedCustomerForSale);
        await updateDoc(customerRef, {
          balance: (customer.balance || 0) + cartTotal
        });
      }

      // 3. Registrar Log
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sales'), {
        customerId: selectedCustomerForSale,
        customerName: customer ? customer.name : 'Desconhecido',
        total: cartTotal,
        items: cart,
        date: serverTimestamp()
      });

      // 4. Limpar
      setCart([]);
      setSelectedCustomerForSale('');
      alert("Venda realizada com sucesso!");
      setActiveTab('dashboard');

    } catch (error) {
      console.error(error);
      alert("Erro ao processar venda. Verifique sua conexão.");
    }
    setProcessing(false);
  };

  // Pagamentos
  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setProcessing(true);

    try {
      const amount = parseFloat(paymentAmount);
      const customerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'customers', selectedCustomerForPayment.id);
      
      await updateDoc(customerRef, {
        balance: Math.max(0, (selectedCustomerForPayment.balance || 0) - amount)
      });

      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setSelectedCustomerForPayment(null);
    } catch (e) {
      alert("Erro ao processar pagamento");
    }
    setProcessing(false);
  };


  // --- RENDERIZAÇÃO ---

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-pink-500 w-12 h-12 mb-4" />
        <p className="text-gray-500">Carregando sistema...</p>
      </div>
    );
  }

  const renderDashboard = () => {
    const totalReceivable = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
    const lowStock = products.filter(p => p.stock < 5);

    return (
      <div className="space-y-6 pb-20">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Olá!</h1>
            <p className="text-gray-500 text-sm">ID: {user?.uid?.slice(0, 6)}...</p>
          </div>
          <div className="bg-pink-100 p-2 rounded-full">
            <DollarSign className="text-pink-600" />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-pink-500 to-rose-400 border-none text-white">
            <p className="text-pink-100 text-sm mb-1">Total a Receber</p>
            <h2 className="text-2xl font-bold">{formatMoney(totalReceivable)}</h2>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-400 border-none text-white">
            <p className="text-purple-100 text-sm mb-1">Total em Estoque</p>
            <h2 className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.stock, 0)} items</h2>
          </Card>
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-3">Ações Rápidas</h3>
          <Button 
            variant="primary" 
            className="w-full py-4 text-lg shadow-md shadow-pink-200"
            onClick={() => setActiveTab('sales')}
          >
            <ShoppingCart className="w-5 h-5" />
            Nova Venda
          </Button>
        </div>

        {lowStock.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3">Estoque Baixo ⚠️</h3>
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center">
                  <span className="text-orange-800 font-medium">{p.name}</span>
                  <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">
                    Restam {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSales = () => {
    return (
      <div className="pb-24 h-full flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nova Venda</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select 
            className="w-full p-3 rounded-lg border border-gray-300 bg-white"
            value={selectedCustomerForSale}
            onChange={(e) => setSelectedCustomerForSale(e.target.value)}
          >
            <option value="">Selecione quem está comprando...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Toque para adicionar</label>
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className={`p-3 rounded-xl border text-left transition-all ${
                  p.stock > 0 
                    ? 'bg-white border-gray-200 hover:border-pink-300 active:bg-pink-50' 
                    : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-pink-600 font-bold">{formatMoney(p.price)}</span>
                  <span className="text-xs text-gray-500">{p.stock} un</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 pt-4">
          {cart.length > 0 ? (
            <>
              <div className="mb-4 max-h-32 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-1 px-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400"><X size={16}/></button>
                      <span className="text-sm">{item.qty}x {item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatMoney(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-2xl text-pink-600">{formatMoney(cartTotal)}</span>
              </div>
              <Button onClick={finalizeSale} loading={processing} className="w-full py-3 text-lg">
                Confirmar Venda
              </Button>
            </>
          ) : (
            <div className="text-center text-gray-400 py-4">
              Carrinho vazio
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Estoque</h2>
        <Button onClick={() => setIsProductModalOpen(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-3">
        {products.length === 0 && <p className="text-gray-400 text-center py-10">Nenhum produto cadastrado.</p>}
        {products.map(p => (
          <Card key={p.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-pink-600 font-medium">{formatMoney(p.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button onClick={() => updateStock(p, -1)} className="text-gray-500 active:text-pink-600"><Minus size={16}/></button>
                    <span className="w-6 text-center font-bold text-sm">{p.stock}</span>
                    <button onClick={() => updateStock(p, 1)} className="text-gray-500 active:text-green-600"><Plus size={16}/></button>
                 </div>
              </div>
              <button onClick={() => deleteProduct(p.id)} className="text-gray-300 hover:text-red-500 ml-2">
                <Trash2 size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
        <Button onClick={() => setIsCustomerModalOpen(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-3">
        {customers.length === 0 && <p className="text-gray-400 text-center py-10">Nenhum cliente cadastrado.</p>}
        {customers.map(c => (
          <Card key={c.id} className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${c.balance > 0 ? 'bg-red-400' : 'bg-green-400'}`}>
                    {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{c.name}</h3>
                  <p className={`text-sm font-medium ${c.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {c.balance > 0 ? `Deve: ${formatMoney(c.balance)}` : 'Em dia'}
                  </p>
                </div>
              </div>
              <button onClick={() => deleteCustomer(c.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
            
            {c.balance > 0 && (
                <Button 
                    variant="outline" 
                    className="w-full text-sm py-1 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                        setSelectedCustomerForPayment(c);
                        setIsPaymentModalOpen(true);
                    }}
                >
                    <DollarSign size={14} className="mr-1"/> Receber Pagamento
                </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <main className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'customers' && renderCustomers()}
      </main>

      {/* Menu Inferior */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center absolute bottom-0 w-full z-10">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-pink-600' : 'text-gray-400'}`}>
          <Home size={24} /> <span className="text-xs font-medium">Início</span>
        </button>
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-pink-600' : 'text-gray-400'}`}>
          <ShoppingCart size={24} /> <span className="text-xs font-medium">Venda</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 ${activeTab === 'inventory' ? 'text-pink-600' : 'text-gray-400'}`}>
          <Package size={24} /> <span className="text-xs font-medium">Estoque</span>
        </button>
        <button onClick={() => setActiveTab('customers')} className={`flex flex-col items-center gap-1 ${activeTab === 'customers' ? 'text-pink-600' : 'text-gray-400'}`}>
          <Users size={24} /> <span className="text-xs font-medium">Clientes</span>
        </button>
      </nav>

      {/* MODAL PRODUTO */}
      {isProductModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Novo Produto</h3>
            <div className="space-y-3">
              <input 
                placeholder="Nome" 
                className="w-full border p-2 rounded-lg"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
              <input 
                placeholder="Preço" 
                type="number" 
                className="w-full border p-2 rounded-lg"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              />
              <input 
                placeholder="Estoque Inicial" 
                type="number" 
                className="w-full border p-2 rounded-lg"
                value={newProduct.stock}
                onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsProductModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={addProduct} loading={processing} className="flex-1">Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {isCustomerModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Novo Cliente</h3>
            <div className="space-y-3">
              <input 
                placeholder="Nome do Cliente" 
                className="w-full border p-2 rounded-lg"
                value={newCustomer.name}
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsCustomerModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={addCustomer} loading={processing} className="flex-1">Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {isPaymentModalOpen && selectedCustomerForPayment && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Receber de {selectedCustomerForPayment.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Dívida: {formatMoney(selectedCustomerForPayment.balance)}</p>
            <div className="space-y-3">
              <input 
                placeholder="0.00" 
                type="number" 
                autoFocus
                className="w-full border p-2 rounded-lg text-lg font-bold text-green-600"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={processPayment} loading={processing} variant="primary" className="flex-1 bg-green-600 hover:bg-green-700">Confirmar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
