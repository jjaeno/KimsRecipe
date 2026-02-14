export type CustomSetMode = 'CREATE' | 'EDIT';

export type SelectedItem = { hpMenuId: string; quantity: number };

export type HomePartyMenu = {
  hpMenuId: string;
  menuName: string;
  price: number;
  imageUrl?: string;
  amount?: string;
  menuStatus: string;
  hpCategoryId: string;
};

export type HomePartyCategory = {
  hpCategoryId: string;
  categoryName: string;
};

export type CustomSetRouteParams = {
  mode: CustomSetMode;

  storeId: string;
  eventType: string;
  eventDateTime: string;
  headcount: number;
  budgetMin?: number;
  budgetMax?: number;

  initialSelectedItems?: SelectedItem[];

  existingSetConfig?: {
    title?: string;
    items: SelectedItem[];
    recommendedMinHeadcount?: number;
    recommendedMaxHeadcount?: number;
  };

  userDisplayName: string;
};

export type HomePartyMenuRouteParams = CustomSetRouteParams;

export const MENU_SELECTION_STORAGE_PREFIX = 'homePartyMenuSelection';

export const buildHomePartySelectionStorageKey = (params: {
  storeId: string;
  eventType: string;
  eventDateTime: string;
  mode: CustomSetMode;
}) => {
  return [
    MENU_SELECTION_STORAGE_PREFIX,
    String(params.storeId ?? ''),
    String(params.eventType ?? ''),
    String(params.eventDateTime ?? ''),
    String(params.mode ?? ''),
  ].join(':');
};
