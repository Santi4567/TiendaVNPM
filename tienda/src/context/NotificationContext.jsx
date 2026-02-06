import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  /**
   * @param {string} message - El texto a mostrar
   * @param {string} type - 'success' | 'error' | 'info'
   */
  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* RENDERIZADO DEL TOAST AQUÍ MISMO */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all transform animate-fade-in-down ${
            notification.type === 'error' 
                ? 'bg-red-600 text-white' 
                : notification.type === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-green-600 text-white'
        }`}>
            <span className="text-2xl">
                {notification.type === 'error' ? '✕' : '✓'}
            </span>
            <div>
                <p className="font-bold text-sm uppercase">{notification.type === 'error' ? 'Error' : 'Éxito'}</p>
                <p className="text-sm font-medium">{notification.message}</p>
            </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};