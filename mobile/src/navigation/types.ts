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
  UserProfile: { userId: string };
  PinGourmetFriend: { userId: string };
};

export type BindersStackParamList = {
  BindersList: undefined;
  BinderDetail: { binderId: string; binderName: string };
  NoteDetail: { noteId: string };
  FollowedBinders: undefined;
  UserProfile: { userId: string };
  PinGourmetFriend: { userId: string };
};

export type SearchStackParamList = {
  Search: undefined;
  NoteDetail: { noteId: string };
  Explore: undefined;
  Discover: undefined;
  UserProfile: { userId: string };
  PinGourmetFriend: { userId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  GourmetFriends: undefined;
  UserProfile: { userId: string };
  PinGourmetFriend: { userId: string };
};

export type NoteCreationStackParamList = {
  NoteTypeSelect: undefined;
  RestaurantNoteForm: undefined;
  WineNoteForm: undefined;
  SpiritNoteForm: undefined;
  WineryVisitNoteForm: undefined;
};
