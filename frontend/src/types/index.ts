export interface Candidate {
  id: number;
  name: string;
  score: number;
  stageId: number;
}

export interface Stage {
  id: number;
  name: string;
  order: number;
}

export interface Position {
  id: number;
  title: string;
  department: string;
  description: string;
}
