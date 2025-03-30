import axios from 'axios';
import { Candidate, Position, Stage } from '../types';

const API_URL = 'http://localhost:3010';

export const getInterviewFlow = async (positionId: number): Promise<Stage[]> => {
  try {
    const response = await axios.get(`${API_URL}/positions/${positionId}/interviewFlow`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener las fases del proceso:', error);
    throw new Error('No se pudieron cargar las fases del proceso');
  }
};

export const getPositionCandidates = async (positionId: number): Promise<Candidate[]> => {
  try {
    const response = await axios.get(`${API_URL}/positions/${positionId}/candidates`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los candidatos:', error);
    throw new Error('No se pudieron cargar los candidatos');
  }
};

export const updateCandidateStage = async (candidateId: number, stageId: number): Promise<Candidate> => {
  try {
    const response = await axios.put(`${API_URL}/candidates/${candidateId}/stage`, { stageId });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar la fase del candidato:', error);
    throw new Error('No se pudo actualizar la fase del candidato');
  }
};

export const getPosition = async (positionId: number): Promise<Position> => {
  try {
    const response = await axios.get(`${API_URL}/positions/${positionId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener la posición:', error);
    throw new Error('No se pudo cargar la posición');
  }
};
