import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type KnowledgeGraphData = {
  nodes: { id: string; type: 'task' | 'doc' | 'user'; label: string }[];
  edges: { from: string; to: string; type: string }[];
};

export type KnowledgeAtlasData = {
  nodes: {
    id: string;
    label: string;
    type: 'doc' | 'task';
    group: string;
    projectName: string;
  }[];
  edges: { from: string; to: string; strength: number }[];
};

export type KnowledgeDiagnosis = {
  diagnosis: string;
  recommendations: string[];
};

export type StrategicCollision = {
  id: string;
  intensity: number;
  protocol: string;
  nodes: {
    id: string;
    type: 'task' | 'doc';
    title: string;
    projectName: string;
  }[];
};

export const getKnowledgeGraph = (projectId: string) =>
  authApi.get<KnowledgeGraphData>(API_ENDPOINTS.knowledge.graph(projectId));

export const generateKnowledgeDiary = (projectId: string) =>
  authApi.post<void>(API_ENDPOINTS.knowledge.diary(projectId), undefined, {
    responseType: 'void',
  });

export const getKnowledgeAtlas = () =>
  authApi.get<KnowledgeAtlasData>(API_ENDPOINTS.knowledge.atlas);

export const getKnowledgeDiagnosis = () =>
  authApi.get<KnowledgeDiagnosis>(API_ENDPOINTS.knowledge.diagnosis);

export const getKnowledgeDivergence = () =>
  authApi.get<StrategicCollision[]>(API_ENDPOINTS.knowledge.divergence);
