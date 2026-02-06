import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import versiculosData from '../data/versiculos.json'; // Importamos el JSON

const Home = () => {
  const { user } = useAuth();
  const [versiculo, setVersiculo] = useState({ cita: '', texto: '' });
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    // 1. Obtener fecha actual formateada
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaActual = new Date().toLocaleDateString('es-ES', opciones);
    setFecha(fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)); // Capitalizar primera letra

    // 2. Elegir versículo aleatorio
    const indiceAleatorio = Math.floor(Math.random() * versiculosData.length);
    setVersiculo(versiculosData[indiceAleatorio]);
  }, []);

  // Determinar saludo según la hora
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-[80vh] flex flex-col justify-center items-center">
      
      {/* TARJETA DE BIENVENIDA */}
      <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up">
        
        {/* Encabezado con degradado suave */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
              {saludo}, {user?.nombre || user?.usuario || 'Usuario'}
            </h1>
            <p className="text-blue-100 text-lg font-medium opacity-90">
              {fecha}
            </p>
        </div>

        {/* Cuerpo de la tarjeta */}
        <div className="p-8 md:p-12 text-center">
            
            {/* Badge de Rol */}
            <div className="mb-8">
                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
                    user?.rolId === 1 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                    Rol: {user?.rolId === 1 ? 'Administrador' : 'Vendedor / Usuario'}
                </span>
            </div>

            <hr className="border-gray-100 my-8 w-1/2 mx-auto" />

            {/* SECCIÓN DEL VERSÍCULO */}
            <div className="max-w-2xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl shadow-sm transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex flex-col gap-4">
                    <span className="text-4xl text-yellow-400 leading-none self-start">“</span>
                    <p className="text-xl md:text-2xl text-gray-700 font-serif italic leading-relaxed px-4">
                        {versiculo.texto}
                    </p>
                    <span className="text-4xl text-yellow-400 leading-none self-end">”</span>
                    <p className="text-right font-bold text-gray-500 uppercase tracking-wide text-sm mt-2">
                        — {versiculo.cita}
                    </p>
                </div>
            </div>

        </div>
      </div>

      <p className="mt-8 text-gray-400 text-sm font-medium">
        Selecciona una opción del menú superior para comenzar.
      </p>

    </div>
  );
};

export default Home;