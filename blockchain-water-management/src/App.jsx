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
          <Route path="/" element={<AssetList />} />
          <Route path="/create-update" element={<CreateUpdateAsset />} />
          <Route path="/read-delete/:id" element={<ReadDeleteAsset />} />
          <Route path="*" element={<h3>Endereço Inválido</h3>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
