import React, { useState } from 'react';
import { createAsset, updateAsset } from '../services/api';

const CreateUpdateAsset = () => {
    const [formData, setFormData] = useState({
        id: '',
        nomeRioCidade: '',
        temperatura: '',
        pH: '',
        microbiologicos: 'Sem dados',
        quimicos: 'Sem dados'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreate = async () => {
        try {
            await createAsset(formData);
            alert('Ativo criado com sucesso!');
        } catch (error) {
            alert(`Erro ao criar ativo: ${error.message}`);
        }
    };

    const handleUpdate = async () => {
        try {
            await updateAsset(formData.id, formData);
            alert('Ativo atualizado com sucesso!');
        } catch (error) {
            alert(`Erro ao atualizar ativo: ${error.message}`);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Criar ou Atualizar Ativo</h2>
            <form>
                <div className="mb-3">
                    <label htmlFor="id" className="form-label">ID</label>
                    <input
                        id="id"
                        name="id"
                        className="form-control"
                        placeholder="ID"
                        value={formData.id}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="nomeRioCidade" className="form-label">Nome do Rio / Cidade</label>
                    <input
                        id="nomeRioCidade"
                        name="nomeRioCidade"
                        className="form-control"
                        placeholder="Nome do Rio"
                        value={formData.nomeRioCidade}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="temperatura" className="form-label">Temperatura</label>
                    <input
                        id="temperatura"
                        name="temperatura"
                        className="form-control"
                        placeholder="Temperatura"
                        value={formData.temperatura}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="pH" className="form-label">pH</label>
                    <input
                        id="pH"
                        name="pH"
                        className="form-control"
                        placeholder="pH"
                        value={formData.pH}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="microbiologicos" className="form-label">Microbiológicos</label>
                    <select
                        id="microbiologicos"
                        name="microbiologicos"
                        className="form-control"
                        value={formData.microbiologicos}
                        onChange={handleChange}
                    >
                        <option value="Sem dados">Sem dados</option>
                        <option value="Muito baixo">Muito baixo</option>
                        <option value="Baixo">Baixo</option>
                        <option value="Médio">Médio</option>
                        <option value="Alto">Alto</option>
                        <option value="Muito alto">Muito alto</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="quimicos" className="form-label">Químicos</label>
                    <select
                        id="quimicos"
                        name="quimicos"
                        className="form-control"
                        value={formData.quimicos}
                        onChange={handleChange}
                    >
                        <option value="Sem dados">Sem dados</option>
                        <option value="Muito baixo">Muito baixo</option>
                        <option value="Baixo">Baixo</option>
                        <option value="Médio">Médio</option>
                        <option value="Alto">Alto</option>
                        <option value="Muito alto">Muito alto</option>
                    </select>
                </div>
                <button type="button" className="btn btn-primary me-2" onClick={handleCreate}>Criar</button>
                <button type="button" className="btn btn-warning" onClick={handleUpdate}>Atualizar</button>
            </form>
        </div>
    );
};

export default CreateUpdateAsset;
