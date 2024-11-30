import React, { useEffect, useState } from 'react';
import { getAllAssets } from '../services/api';
import { useNavigate } from 'react-router-dom'; // Hook para navegação

const AssetList = () => {
    const [assets, setAssets] = useState([]);
    const navigate = useNavigate(); // Hook para navegação

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await getAllAssets();
                setAssets(response.data);
            } catch (error) {
                alert(`Erro ao obter ativos: ${error.message}`);
            }
        };
        fetchAssets();
    }, []);

    const handleClick = (id) => {
        navigate(`/read-delete/${id}`); // Redireciona para a página de leitura e deleção do ativo com o 'id'
    };

    return (
        <div className="container mt-4">
            <h1>Bem-Vindo!</h1>
            <h2 className="mb-4">Lista de Ativos</h2>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome do Rio / Cidade</th>
                        <th>Temperatura</th>
                        <th>pH</th>
                        <th>Microbiologicos</th>
                        <th>Quimicos</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset) => (
                        <tr key={asset.ID} onClick={() => handleClick(asset.ID)} style={{ cursor: 'pointer' }}>
                            <td>{asset.ID}</td>
                            <td>{asset.NomeRioCidade}</td>
                            <td>{asset.Temperatura}</td>
                            <td>{asset.Ph}</td>
                            <td>{asset.Microbiologicos}</td>
                            <td>{asset.Quimicos}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AssetList;
