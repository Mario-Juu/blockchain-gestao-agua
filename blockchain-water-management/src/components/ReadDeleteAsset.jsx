import React, { useState } from 'react';
import { readAsset, deleteAsset } from '../services/api';

const ReadDeleteAsset = () => {
    const [id, setId] = useState('');
    const [asset, setAsset] = useState(null);

    const handleRead = async () => {
        try {
            const response = await readAsset(id);
            setAsset(response.data);
        } catch (error) {
            alert(`Erro ao ler ativo: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAsset(id);
            alert('Ativo deletado com sucesso!');
            setAsset(null);
        } catch (error) {
            alert(`Erro ao deletar ativo: ${error.message}`);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Ler ou Deletar Ativo</h2>
            <div className="mb-3">
                <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="form-control"
                    placeholder="Digite o ID"
                />
            </div>
            <button className="btn btn-primary me-2" onClick={handleRead}>Ler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Deletar</button>

            {asset && (
                <div className="mt-4">
                    <h3>Informações do Ativo</h3>
                    <ul className="list-group">
                        <li className="list-group-item">ID: {asset.ID}</li>
                        <li className="list-group-item">Nome do Rio: {asset.NomeRioCidade}</li>
                        <li className="list-group-item">Temperatura: {asset.Temperatura}</li>
                        <li className="list-group-item">pH: {asset.Ph}</li>
                        <li className="list-group-item">Microbiologicos: {asset.Microbiologicos}</li>
                        <li className="list-group-item">Quimicos: {asset.Quimicos}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ReadDeleteAsset;
