import { Request, Response } from 'express';
import { Client } from '../models/index.js';

export const getAllClients = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find().sort({ name: 1 }).lean();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

export const getClientsByManager = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find({ managerId: req.params.managerId }).sort({ name: 1 }).lean();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { managerId, name, startDate, notes, dot, archived } = req.body;
    if (!managerId || !name || !name.trim()) {
      return res.status(400).json({ message: 'Informe o gestor e o nome do cliente' });
    }
    const client = await Client.create({
      managerId,
      name: name.trim(),
      startDate: startDate || null,
      notes: notes || null,
      dot: dot || '',
      archived: archived || false,
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Erro ao criar cliente' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { managerId, name, startDate, notes, dot, archived } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Informe o nome do cliente' });
    }
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        managerId,
        name: name.trim(),
        startDate: startDate || null,
        notes: notes || null,
        dot: dot || '',
        archived: archived || false,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
};

export const archiveClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    ).lean();
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error archiving client:', error);
    res.status(500).json({ message: 'Erro ao arquivar cliente' });
  }
};