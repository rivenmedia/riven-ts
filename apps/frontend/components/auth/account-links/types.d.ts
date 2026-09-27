export interface Account {
  id: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  scopes: string[];
}

export interface Provider {
  enabled: boolean;
  disableSignup: boolean;
  name?: string;
  icon?: string;
}
