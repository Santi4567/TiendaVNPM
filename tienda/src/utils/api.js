
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3001';

export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      
    },
    credentials: 'include', // <--- ESTO ES LA CLAVE MÁGICA para el Http-only
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Si la cookie expiró o es inválida (401), el backend nos avisará
    if (response.status === 401) {
       // Opcional: Disparar un evento para que AuthContext haga logout
    }

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Error de red:', error);
    throw error;
  }
};