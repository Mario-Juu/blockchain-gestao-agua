import React, { useState, useEffect } from 'react';
import { readAsset, deleteAsset } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const ReadDeleteAsset = () => {
    const { id } = useParams(); // Obtém o 'id' do ativo da URL
    const [asset, setAsset] = useState(null);
    const navigate = useNavigate(); // Hook para navegação programática

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await readAsset(id); // Utiliza o 'id' para buscar os dados do ativo
                setAsset(response.data);
            } catch (error) {
                alert(`Erro ao ler ativo: ${error.message}`);
            }
        };
        fetchAsset();
    }, [id]); // Reexecuta o efeito sempre que o 'id' mudar

    const handleDelete = async () => {
        try {
            await deleteAsset(id); // Deleta o ativo com o 'id'
            alert('Ativo deletado com sucesso!');
            navigate('/'); // Redireciona para a home após deletar
        } catch (error) {
            alert(`Erro ao deletar ativo: ${error.message}`);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Deletar Ativo</h2>
            {asset ? (
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
                    <button className="btn btn-danger mt-4" onClick={handleDelete}>Deletar</button>
                </div>
            ) : (
                <p>Carregando...</p>
            )}
        </div>
    );
};

export default ReadDeleteAsset;
