import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Não precisa de BrowserRouter aqui
import Header from './components/Header';
import CreateUpdateAsset from './components/CreateUpdateAsset';
import ReadDeleteAsset from './components/ReadDeleteAsset';
import AssetList from './components/AssetList';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const App = () => {
  return (
    <div>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<h2>Bem-vindo à Gestão de Qualidade da Água</h2>} />
          <Route path="/create-update" element={<CreateUpdateAsset />} />
          <Route path="/read-delete" element={<ReadDeleteAsset />} />
          <Route path="/list-assets" element={<AssetList />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
