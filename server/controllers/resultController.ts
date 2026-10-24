import { Request, Response } from 'express';
import { WeeklyResult } from '../models/index.js';

export const getResultsForClients = async (req: Request, res: Response) => {
  try {
    const { clientIds } = req.query;
    if (!clientIds) {
      return res.status(400).json({ message: 'clientIds é obrigatório' });
    }
    const ids = (clientIds as string).split(',').filter(Boolean);
    if (ids.length === 0) {
      return res.json([]);
    }
    const results = await WeeklyResult.find({ clientId: { $in: ids } })
      .sort({ periodStart: 1 })
      .lean();
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Erro ao buscar resultados' });
  }
};

export const getResultById = async (req: Request, res: Response) => {
  try {
    const result = await WeeklyResult.findById(req.params.id).lean();
    if (!result) {
      return res.status(404).json({ message: 'Resultado não encontrado' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Erro ao buscar resultado' });
  }
};

export const createOrUpdateResult = async (req: Request, res: Response) => {
  try {
    const { id, clientId, periodStart, periodEnd, leads, cpl, notes } = req.body;
    if (!clientId || !periodStart || !periodEnd || leads === undefined || cpl === undefined) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }
    const data = {
      clientId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      leads: Number(leads),
      cpl: Number(cpl),
      notes: notes || null,
    };
    let result;
    if (id) {
      result = await WeeklyResult.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    } else {
      result = await WeeklyResult.create(data);
    }
    if (!result) {
      return res.status(404).json({ message: 'Resultado não encontrado' });
    }
    res.status(id ? 200 : 201).json(result);
  } catch (error: any) {
    console.error('Error saving result:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Já existe um resultado para esse cliente nesse período' });
    }
    res.status(500).json({ message: 'Erro ao salvar resultado' });
  }
};

export const deleteResult = async (req: Request, res: Response) => {
  try {
    const result = await WeeklyResult.findByIdAndDelete(req.params.id).lean();
    if (!result) {
      return res.status(404).json({ message: 'Resultado não encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ message: 'Erro ao deletar resultado' });
  }
};