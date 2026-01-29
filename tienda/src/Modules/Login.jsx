import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiCall('/api/users/login', 'POST', { Usuario: usuario, Passwd: password });

      if (res.data.success) {
        login(res.data.data.user); 
        navigate('/'); 
      } else {
        setError(res.data.message || 'Credenciales incorrectas');
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
      
      {/* Contenedor Principal (Tarjeta blanca) */}
      <div className="w-full max-w-lg px-8 py-12 transition-all duration-300 transform bg-white shadow-2xl rounded-3xl sm:px-12 border border-white/20 backdrop-blur-sm">
        
        {/* Encabezado */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2">
            GestionVN
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">
            Sistema de Administración
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 rounded animate-fade-in-down flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 ml-1">Usuario</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-5 py-4 text-gray-800 bg-gray-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-bold text-gray-700">Contraseña</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 text-gray-800 bg-gray-200 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-4 text-lg font-bold text-white transition-all duration-200 rounded-xl shadow-lg 
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando...
              </span>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* Footer simple */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2026 Plataforma Segura. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;