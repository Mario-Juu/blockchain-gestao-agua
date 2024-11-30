import React, { useState } from 'react';
import { createAsset, updateAsset } from '../services/api';

const CreateUpdateAsset = () => {
    const [formData, setFormData] = useState({
        id: '',
        nomeRioCidade: '',
        temperatura: '',
        pH: '',
        microbiologicos: '',
        quimicos: ''
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
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="microbiologicos" className="form-label">Microbiológicos</label>
                    <input
                        id="microbiologicos"
                        name="microbiologicos"
                        className="form-control"
                        placeholder="Microbiológicos"
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="quimicos" className="form-label">Químicos</label>
                    <input
                        id="quimicos"
                        name="quimicos"
                        className="form-control"
                        placeholder="Químicos"
                        onChange={handleChange}
                    />
                </div>
                <button type="button" className="btn btn-primary me-2" onClick={handleCreate}>Criar</button>
                <button type="button" className="btn btn-warning" onClick={handleUpdate}>Atualizar</button>
            </form>
        </div>
    );
};

export default CreateUpdateAsset;
