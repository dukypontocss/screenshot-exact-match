import { Request, Response } from 'express';
import { Manager } from '../models/index.js';

export const getManagers = async (req: Request, res: Response) => {
  try {
    const managers = await Manager.find({ archived: false }).sort({ name: 1 }).lean();
    res.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ message: 'Erro ao buscar gestores' });
  }
};

export const getManagerById = async (req: Request, res: Response) => {
  try {
    const manager = await Manager.findById(req.params.id).lean();
    if (!manager) {
      return res.status(404).json({ message: 'Gestor não encontrado' });
    }
    res.json(manager);
  } catch (error) {
    console.error('Error fetching manager:', error);
    res.status(500).json({ message: 'Erro ao buscar gestor' });
  }
};

export const createManager = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Informe o nome do gestor' });
    }
    const manager = await Manager.create({ name: name.trim() });
    res.status(201).json(manager);
  } catch (error: any) {
    console.error('Error creating manager:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Já existe um gestor com esse nome' });
    }
    res.status(500).json({ message: 'Erro ao criar gestor' });
  }
};

export const updateManager = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Informe o nome do gestor' });
    }
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).lean();
    if (!manager) {
      return res.status(404).json({ message: 'Gestor não encontrado' });
    }
    res.json(manager);
  } catch (error: any) {
    console.error('Error updating manager:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Já existe um gestor com esse nome' });
    }
    res.status(500).json({ message: 'Erro ao atualizar gestor' });
  }
};

export const archiveManager = async (req: Request, res: Response) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    ).lean();
    if (!manager) {
      return res.status(404).json({ message: 'Gestor não encontrado' });
    }
    res.json(manager);
  } catch (error) {
    console.error('Error archiving manager:', error);
    res.status(500).json({ message: 'Erro ao arquivar gestor' });
  }
};