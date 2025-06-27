import React, { useEffect, useState } from 'react';
import { getAllAssets } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AssetList = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getAllAssets();
                
                // Adaptar para a estrutura do novo backend (MongoDB ou Blockchain)
                const assetsData = response.data || response;
                setAssets(Array.isArray(assetsData) ? assetsData : []);
            } catch (error) {
                console.error('Erro ao obter ativos:', error);
                setError('Erro ao carregar os dados. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    const handleClick = (id) => {
        navigate(`/read-delete/${id}`);
    };

    const handleRefresh = async () => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getAllAssets();
                const assetsData = response.data || response;
                setAssets(Array.isArray(assetsData) ? assetsData : []);
            } catch (error) {
                setError('Erro ao carregar os dados. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };
        await fetchAssets();
    };

    // Função para filtrar assets
    const filteredAssets = assets.filter(asset => {
        const searchString = searchTerm.toLowerCase();
        const matchesSearch = 
            (asset.ID || asset.id || '').toString().toLowerCase().includes(searchString) ||
            (asset.NomeRioCidade || asset.nomeRioCidade || '').toString().toLowerCase().includes(searchString) ||
            (asset.Temperatura || asset.temperatura || '').toString().toLowerCase().includes(searchString);

        if (filterBy === 'all') return matchesSearch;
        if (filterBy === 'high-temp') return matchesSearch && parseFloat(asset.Temperatura || asset.temperatura || 0) > 25;
        if (filterBy === 'low-ph') return matchesSearch && parseFloat(asset.Ph || asset.pH || 7) < 6.5;
        if (filterBy === 'high-ph') return matchesSearch && parseFloat(asset.Ph || asset.pH || 7) > 8.5;
        
        return matchesSearch;
    });

    const getStatusBadge = (asset) => {
        const temp = parseFloat(asset.Temperatura || asset.temperatura || 0);
        const ph = parseFloat(asset.Ph || asset.pH || 7);
        
        if (temp > 30 || ph < 6 || ph > 9) {
            return <span className="badge bg-danger">Crítico</span>;
        } else if (temp > 25 || ph < 6.5 || ph > 8.5) {
            return <span className="badge bg-warning">Atenção</span>;
        } else {
            return <span className="badge bg-success">Normal</span>;
        }
    };

    const getTemperatureColor = (temp) => {
        const temperature = parseFloat(temp);
        if (temperature > 30) return 'text-danger fw-bold';
        if (temperature > 25) return 'text-warning fw-bold';
        return 'text-success';
    };

    const getPHColor = (ph) => {
        const phValue = parseFloat(ph);
        if (phValue < 6 || phValue > 9) return 'text-danger fw-bold';
        if (phValue < 6.5 || phValue > 8.5) return 'text-warning fw-bold';
        return 'text-success';
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow-sm">
                            <div className="card-body p-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Carregando...</span>
                                </div>
                                <h5>Carregando dados...</h5>
                                <p className="text-muted">Aguarde enquanto buscamos as informações dos ativos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="alert alert-danger shadow-sm" role="alert">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-exclamation-triangle-fill me-2" style={{fontSize: '1.5rem'}}></i>
                                <div className="flex-grow-1">
                                    <h5 className="alert-heading mb-1">Erro ao carregar dados</h5>
                                    <p className="mb-2">{error}</p>
                                    <button className="btn btn-outline-danger btn-sm" onClick={handleRefresh}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        Tentar novamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            {/* Header com animação */}
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <h1 className="display-5 fw-bold text-primary mb-2">
                                💧 Qualidade da Água
                            </h1>
                            <p className="lead text-muted">
                                Monitoramento em tempo real dos recursos hídricos
                            </p>
                        </div>
                        <div className="text-end">
                            <button 
                                className="btn btn-outline-primary btn-lg"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white shadow-sm">
                        <div className="card-body text-center">
                            <i className="bi bi-droplet-fill" style={{fontSize: '2rem'}}></i>
                            <h3 className="mt-2">{assets.length}</h3>
                            <p className="mb-0">Total de Ativos</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white shadow-sm">
                        <div className="card-body text-center">
                            <i className="bi bi-check-circle-fill" style={{fontSize: '2rem'}}></i>
                            <h3 className="mt-2">
                                {assets.filter(a => {
                                    const temp = parseFloat(a.Temperatura || a.temperatura || 0);
                                    const ph = parseFloat(a.Ph || a.pH || 7);
                                    return temp <= 25 && ph >= 6.5 && ph <= 8.5;
                                }).length}
                            </h3>
                            <p className="mb-0">Normais</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-white shadow-sm">
                        <div className="card-body text-center">
                            <i className="bi bi-exclamation-triangle-fill" style={{fontSize: '2rem'}}></i>
                            <h3 className="mt-2">
                                {assets.filter(a => {
                                    const temp = parseFloat(a.Temperatura || a.temperatura || 0);
                                    const ph = parseFloat(a.Ph || a.pH || 7);
                                    return (temp > 25 && temp <= 30) || (ph < 6.5 && ph >= 6) || (ph > 8.5 && ph <= 9);
                                }).length}
                            </h3>
                            <p className="mb-0">Atenção</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-danger text-white shadow-sm">
                        <div className="card-body text-center">
                            <i className="bi bi-x-circle-fill" style={{fontSize: '2rem'}}></i>
                            <h3 className="mt-2">
                                {assets.filter(a => {
                                    const temp = parseFloat(a.Temperatura || a.temperatura || 0);
                                    const ph = parseFloat(a.Ph || a.pH || 7);
                                    return temp > 30 || ph < 6 || ph > 9;
                                }).length}
                            </h3>
                            <p className="mb-0">Críticos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros e busca */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">🔍 Pesquisar</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por ID, cidade ou temperatura..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">🏷️ Filtrar por</label>
                            <select
                                className="form-select"
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                            >
                                <option value="all">Todos os ativos</option>
                                <option value="high-temp">Temperatura alta (&gt; 25°C)</option>
                                <option value="low-ph">pH baixo (&lt; 6.5)</option>
                                <option value="high-ph">pH alto (&gt; 8.5)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de ativos */}
            <div className="card shadow">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-table me-2"></i>
                        Lista de Ativos ({filteredAssets.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredAssets.length === 0 ? (
                        <div className="text-center p-5">
                            <i className="bi bi-inbox" style={{fontSize: '3rem', color: '#6c757d'}}></i>
                            <h5 className="mt-3 text-muted">Nenhum ativo encontrado</h5>
                            <p className="text-muted">
                                {assets.length === 0 
                                    ? 'Não há ativos cadastrados ainda.' 
                                    : 'Tente ajustar os filtros de busca.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>🏞️ Rio/Cidade</th>
                                        <th>🌡️ Temperatura</th>
                                        <th>⚗️ pH</th>
                                        <th>🦠 Microbiológicos</th>
                                        <th>🧪 Químicos</th>
                                        <th>📊 Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssets.map((asset, index) => (
                                        <tr 
                                            key={asset.ID || asset.id || index}
                                            className="align-middle"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                animationDelay: `${index * 0.1}s`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.01)';
                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {asset.ID || asset.id}
                                                </span>
                                            </td>
                                            <td className="fw-semibold">
                                                {asset.NomeRioCidade || asset.nomeRioCidade}
                                            </td>
                                            <td className={getTemperatureColor(asset.Temperatura || asset.temperatura)}>
                                                {asset.Temperatura || asset.temperatura}°C
                                            </td>
                                            <td className={getPHColor(asset.Ph || asset.pH)}>
                                                {asset.Ph || asset.pH}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    (asset.Microbiologicos || asset.microbiologicos) === 'Alto' || 
                                                    (asset.Microbiologicos || asset.microbiologicos) === 'Muito alto' 
                                                        ? 'bg-danger' 
                                                        : (asset.Microbiologicos || asset.microbiologicos) === 'Médio' 
                                                            ? 'bg-warning' 
                                                            : 'bg-success'
                                                }`}>
                                                    {asset.Microbiologicos || asset.microbiologicos}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    (asset.Quimicos || asset.quimicos) === 'Alto' || 
                                                    (asset.Quimicos || asset.quimicos) === 'Muito alto' 
                                                        ? 'bg-danger' 
                                                        : (asset.Quimicos || asset.quimicos) === 'Médio' 
                                                            ? 'bg-warning' 
                                                            : 'bg-success'
                                                }`}>
                                                    {asset.Quimicos || asset.quimicos}
                                                </span>
                                            </td>
                                            <td>
                                                {getStatusBadge(asset)}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => handleClick(asset.ID || asset.id)}
                                                    title="Ver detalhes"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer info */}
            <div className="text-center mt-4 text-muted">
                <small>
                    <i className="bi bi-info-circle me-1"></i>
                    Clique em qualquer linha para ver os detalhes do ativo
                </small>
            </div>
        </div>
    );
};

export default AssetList;