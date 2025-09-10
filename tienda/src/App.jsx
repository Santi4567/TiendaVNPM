import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import './App.css'
import Clientes from './Modules/Clientes.jsx';
import Caja from './Modules/Caja.jsx';
import CRUD from './Modules/CRUDClientes.jsx';
import Productos from './Modules/Productos.jsx';
import Historico from './Modules/Historico.jsx';


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <Router>    
          <Routes>   
            <Route path="/" element={<Caja />} />
            <Route path="/Clienetes" element={<Clientes />} />
            <Route path="/CRUDClientes" element={<CRUD />} />
            <Route path="/Productos" element={<Productos />} />
            <Route path="/Historico" element={<Historico />} />
            


            {/* Rutas protegidas 
            <Route 
              path="/Productos" 
              element={
                <PrivateRoute>
                  <Productos />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/Clientes" 
              element={
                <PrivateRoute>
                  <Clientes />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/Caja" 
              element={
                <PrivateRoute>
                  <Caja />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/Header" 
              element={
                <PrivateRoute>
                  <Header />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/Historico" 
              element={
                <PrivateRoute>
                  <Historico />
                </PrivateRoute>
              } 
            />
            */}
          </Routes>   
        </Router>      
    </>
  )
}

export default App
