import React, { useState, useEffect } from 'react';
import { Plus, Users, ShoppingCart, Package, Trash2, Minus, Home, X, Loader2, LogOut, Lock, Mail, User } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- URL DO LOGO ---
const LOGO_URL = "http://googleusercontent.com/image_generation_content/0";

// --- CONFIGURAÇÃO DO FIREBASE ---
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

// Sanitiza o ID do app para evitar erros de caminho
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'doce-gestao-app';
const appId = rawAppId.replace(/[\/.]/g, '_');

// --- COMPONENTES UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-blue-100 p-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, loading = false, type="button" }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800", // Azul forte com feedback de toque
    secondary: "bg-cyan-600 hover:bg-cyan-700 text-white", // Ciano
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "text-gray-500 hover:bg-gray-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || loading}
      // Adicionado 'active:scale-95' para dar feedback tátil visual ao tocar no celular
      className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

// --- TELA DE LOGIN ---
const LoginScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState(''); // Novo estado para o Nome
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        // Cria o usuário
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Atualiza o perfil com o Nome
        await updateProfile(userCredential.user, { displayName: name });
        // Força recarregamento da página para exibir o nome corretamente na primeira vez
        window.location.reload();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError('E-mail ou senha incorretos.');
      else if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está cadastrado.');
      else if (err.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
      else setError('Erro ao conectar (' + err.code + ')');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-blue-50">
        <div className="flex flex-col items-center justify-center mb-6">
          {/* LOGO INTEGRADO AQUI */}
          <img src={LOGO_URL} alt="Pedroso Doces Logo" className="w-40 h-auto object-contain mb-4" />
        </div>
        
        <p className="text-center text-gray-500 mb-8">
          {isRegistering ? 'Crie sua conta grátis' : 'Entre para gerenciar'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campo Nome (Aparece apenas no cadastro) */}
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Carlos"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="******"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <Button type="submit" loading={loading} className="w-full shadow-lg shadow-blue-200">
            {isRegistering ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {isRegistering ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesLog, setSalesLog] = useState([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '' });
  const [cart, setCart] = useState([]);
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState('');
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Monitora se o usuário está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Carrega dados APENAS se houver usuário logado
  useEffect(() => {
    if (!user) return;

    // Caminho seguro: /artifacts/{appId}/users/{userId}/...
    const basePath = (coll) => collection(db, 'artifacts', appId, 'users', user.uid, coll);

    const unsubProducts = onSnapshot(basePath('products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => console.error("Erro prod:", error));

    const unsubCustomers = onSnapshot(basePath('customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => console.error("Erro cust:", error));

    const unsubSales = onSnapshot(basePath('sales'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalesLog(data.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
    }, (error) => console.error("Erro sale:", error));

    return () => {
      unsubProducts();
      unsubCustomers();
      unsubSales();
    };
  }, [user]);

  const formatMoney = (value) => {
    return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleLogout = () => {
    if(confirm("Deseja sair da conta?")) {
        signOut(auth);
    }
  };

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
      console.error(e);
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
      console.error(e);
      alert("Erro ao salvar cliente");
    }
    setProcessing(false);
  };

  const deleteCustomer = async (id) => {
    if (confirm('Excluir cliente? O histórico de dívida será perdido.')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customers', id));
    }
  };

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
      for (const item of cart) {
        const productRef = doc(db, 'artifacts', appId, 'users', user.uid, 'products', item.id);
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
             await updateDoc(productRef, {
                stock: Math.max(0, currentProduct.stock - item.qty)
            });
        }
      }

      const customer = customers.find(c => c.id === selectedCustomerForSale);
      if (customer) {
        const customerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'customers', selectedCustomerForSale);
        await updateDoc(customerRef, {
          balance: (customer.balance || 0) + cartTotal
        });
      }

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sales'), {
        customerId: selectedCustomerForSale,
        customerName: customer ? customer.name : 'Desconhecido',
        total: cartTotal,
        items: cart,
        date: serverTimestamp()
      });

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
      console.error(e);
      alert("Erro ao processar pagamento");
    }
    setProcessing(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12 mb-4" />
        <p className="text-gray-500">Iniciando sistema...</p>
      </div>
    );
  }

  // LÓGICA DE PROTEÇÃO: Se não tiver usuário, exibe LOGIN
  if (!user) {
    return <LoginScreen />;
  }

  // Se tiver usuário, exibe o DASHBOARD
  const renderDashboard = () => {
    const totalReceivable = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
    const lowStock = products.filter(p => p.stock < 5);

    return (
      <div className="space-y-6 pb-20">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {/* LOGO PEQUENO NO HEADER */}
            <img src={LOGO_URL} alt="Pedroso Doces" className="w-12 h-12 rounded-full bg-blue-50 p-1 object-cover" />
            <div>
              {/* Agora exibe o Nome se disponível, ou o e-mail */}
              <h1 className="text-xl font-bold text-gray-800">
                Olá, {user.displayName ? user.displayName.split(' ')[0] : 'Visitante'}!
              </h1>
              <p className="text-gray-500 text-xs truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="bg-white border border-gray-200 p-2 rounded-full hover:bg-gray-50 text-gray-600 shadow-sm transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-400 border-none text-white shadow-lg shadow-blue-200">
            <p className="text-blue-100 text-sm mb-1">Total a Receber</p>
            <h2 className="text-2xl font-bold">{formatMoney(totalReceivable)}</h2>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-500 to-teal-400 border-none text-white shadow-lg shadow-cyan-200">
            <p className="text-cyan-50 text-sm mb-1">Total em Estoque</p>
            <h2 className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.stock, 0)} items</h2>
          </Card>
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-3">Ações Rápidas</h3>
          <Button 
            variant="primary" 
            className="w-full py-4 text-lg shadow-lg shadow-blue-100"
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
            className="w-full p-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                className={`p-3 rounded-xl border text-left transition-all shadow-sm ${
                  p.stock > 0 
                    ? 'bg-white border-gray-200 hover:border-blue-300 active:bg-blue-50' 
                    : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-600 font-bold">{formatMoney(p.price)}</span>
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
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                      <span className="text-sm">{item.qty}x {item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatMoney(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-2xl text-blue-600">{formatMoney(cartTotal)}</span>
              </div>
              <Button onClick={finalizeSale} loading={processing} className="w-full py-3 text-lg shadow-lg shadow-blue-100">
                Confirmar Venda
              </Button>
            </>
          ) : (
            <div className="text-center text-gray-400 py-4 border-2 border-dashed border-gray-200 rounded-lg">
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
        <Button onClick={() => setIsProductModalOpen(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg shadow-blue-100">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-3">
        {products.length === 0 && <p className="text-gray-400 text-center py-10">Nenhum produto cadastrado.</p>}
        {products.map(p => (
          <Card key={p.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-blue-600 font-medium">{formatMoney(p.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button onClick={() => updateStock(p, -1)} className="text-gray-500 active:text-blue-600 hover:bg-gray-200 rounded p-1"><Minus size={16}/></button>
                    <span className="w-6 text-center font-bold text-sm">{p.stock}</span>
                    <button onClick={() => updateStock(p, 1)} className="text-gray-500 active:text-green-600 hover:bg-gray-200 rounded p-1"><Plus size={16}/></button>
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
        <Button onClick={() => setIsCustomerModalOpen(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg shadow-blue-100">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-3">
        {customers.length === 0 && <p className="text-gray-400 text-center py-10">Nenhum cliente cadastrado.</p>}
        {customers.map(c => (
          <Card key={c.id} className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${c.balance > 0 ? 'bg-red-400' : 'bg-green-400'}`}>
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
                    className="w-full text-sm py-2 border-green-200 text-green-700 hover:bg-green-50"
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
    // FIX MOBILE: h-[100dvh] força altura exata da tela visível no celular
    // overflow-hidden impede que a tela inteira role, apenas o conteúdo interno
    // select-none impede a seleção de texto como num site
    // overscroll-none impede o efeito de 'mola' do navegador
    <div className="h-[100dvh] bg-slate-50 font-sans text-gray-900 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative select-none overscroll-none">
      
      {/* Conteúdo rolável */}
      <main className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'customers' && renderCustomers()}
      </main>

      {/* Menu Inferior Fixo e Visível */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center w-full shadow-[0_-5px_10px_rgba(0,0,0,0.05)] shrink-0 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Home size={24} /> <span className="text-xs font-medium">Início</span>
        </button>
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-blue-600' : 'text-gray-400'}`}>
          <ShoppingCart size={24} /> <span className="text-xs font-medium">Venda</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Package size={24} /> <span className="text-xs font-medium">Estoque</span>
        </button>
        <button onClick={() => setActiveTab('customers')} className={`flex flex-col items-center gap-1 ${activeTab === 'customers' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Users size={24} /> <span className="text-xs font-medium">Clientes</span>
        </button>
      </nav>

      {/* MODAL PRODUTO */}
      {isProductModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">Novo Produto</h3>
            <div className="space-y-3">
              <input 
                placeholder="Nome" 
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
              <input 
                placeholder="Preço" 
                type="number" 
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              />
              <input 
                placeholder="Estoque Inicial" 
                type="number" 
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">Novo Cliente</h3>
            <div className="space-y-3">
              <input 
                placeholder="Nome do Cliente" 
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-2">Receber de {selectedCustomerForPayment.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Dívida: {formatMoney(selectedCustomerForPayment.balance)}</p>
            <div className="space-y-3">
              <input 
                placeholder="0.00" 
                type="number" 
                autoFocus
                className="w-full border p-3 rounded-lg text-lg font-bold text-green-600 outline-none focus:ring-2 focus:ring-green-500"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={processPayment} loading={processing} variant="primary" className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">Confirmar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
