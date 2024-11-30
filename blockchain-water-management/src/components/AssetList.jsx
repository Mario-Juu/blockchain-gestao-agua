import React, { useEffect, useState } from 'react';
import { getAllAssets } from '../services/api';

const AssetList = () => {
    const [assets, setAssets] = useState([]);

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

    return (
        <div className="container mt-4">
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
                        <tr key={asset.ID}>
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
