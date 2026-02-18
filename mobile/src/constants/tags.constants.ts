import { NoteType } from '../types';

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  [NoteType.RESTAURANT]: 'Restaurant',
  [NoteType.WINE]: 'Wine',
  [NoteType.SPIRIT]: 'Spirit',
  [NoteType.WINERY_VISIT]: 'Winery Visit',
};

export const NOTE_TYPE_ICONS: Record<NoteType, string> = {
  [NoteType.RESTAURANT]: 'restaurant',
  [NoteType.WINE]: 'wine-bar',
  [NoteType.SPIRIT]: 'local-bar',
  [NoteType.WINERY_VISIT]: 'storefront',
};

export const DISH_CATEGORIES = [
  { value: 'APPETIZER', label: 'Appetizer' },
  { value: 'MAIN', label: 'Main' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'SIDE', label: 'Side' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'OTHER', label: 'Other' },
];

export const WINE_TYPES = [
  { value: 'RED', label: 'Red' },
  { value: 'WHITE', label: 'White' },
  { value: 'ROSE', label: 'Rose' },
  { value: 'SPARKLING', label: 'Sparkling' },
  { value: 'ORANGE', label: 'Orange' },
  { value: 'DESSERT', label: 'Dessert' },
];

export const SPIRIT_TYPES = [
  { value: 'WHISKEY', label: 'Whiskey' },
  { value: 'SAKE', label: 'Sake' },
  { value: 'TEQUILA', label: 'Tequila' },
  { value: 'RUM', label: 'Rum' },
  { value: 'GIN', label: 'Gin' },
  { value: 'BRANDY', label: 'Brandy' },
  { value: 'VODKA', label: 'Vodka' },
  { value: 'OTHER', label: 'Other' },
];

export const PORTION_SIZES = [
  { value: 'SMALL', label: 'Small' },
  { value: 'ADEQUATE', label: 'Adequate' },
  { value: 'GENEROUS', label: 'Generous' },
];

export const WINE_FINISHES = [
  { value: 'SHORT', label: 'Short' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LONG', label: 'Long' },
];

export const SERVING_METHODS = [
  { value: 'NEAT', label: 'Neat' },
  { value: 'ON_ROCKS', label: 'On the Rocks' },
  { value: 'COCKTAIL', label: 'Cocktail' },
  { value: 'WARM', label: 'Warm' },
  { value: 'OTHER', label: 'Other' },
];

export const PURCHASE_CONTEXTS = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'WINE_SHOP', label: 'Wine Shop' },
  { value: 'WINERY', label: 'Winery' },
  { value: 'ONLINE', label: 'Online' },
];
