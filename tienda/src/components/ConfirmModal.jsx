import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, tipo = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-fade-in-up">
        
        {/* ÍCONO SEGÚN TIPO */}
        <div className="flex justify-center mb-4">
            {tipo === 'danger' ? (
                <div className="bg-red-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            ) : (
                <div className="bg-blue-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            )}
        </div>

        {/* TEXTO */}
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 justify-center">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-lg text-white font-bold shadow-lg transition-transform active:scale-95 ${
                    tipo === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {tipo === 'danger' ? 'Sí, Eliminar' : 'Confirmar'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;