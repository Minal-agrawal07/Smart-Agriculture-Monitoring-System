export enum AnalysisType {
  CROP = 'CROP',
  SOIL = 'SOIL'
}

export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi'
}

export interface WeatherData {
  temperature: number;
  conditionCode: number;
  description: string;
}

export interface AnalysisResult {
  condition: string;
  recommendations: string[];
  nextActions: string[];
  weatherContext?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: AnalysisType;
  imageThumbnail: string; // Base64 resized
  result: AnalysisResult;
}

export interface User {
  phone: string;
  name?: string;
}

export interface AppState {
  user: User | null;
  language: Language;
}