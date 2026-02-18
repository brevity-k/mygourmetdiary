import { NoteType } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  BindersTab: undefined;
  CreatePlaceholder: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  NoteDetail: { noteId: string };
};

export type BindersStackParamList = {
  BindersList: undefined;
  BinderDetail: { binderId: string; binderName: string };
  NoteDetail: { noteId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  NoteDetail: { noteId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

export type NoteCreationStackParamList = {
  NoteTypeSelect: undefined;
  RestaurantNoteForm: undefined;
  WineNoteForm: undefined;
  SpiritNoteForm: undefined;
  WineryVisitNoteForm: undefined;
};
