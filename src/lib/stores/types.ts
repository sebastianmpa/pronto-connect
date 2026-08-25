export interface Store {
  id: number;
  prefijo: string;
  description: string;
  urlStore: string;
  storeLogoBodyColor: string | null;
  storeLogoBodyWhite: string | null;
  storeHash: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  clientId2: string;
  clientSecret2: string;
  accessToken2: string;
  bcApiUrl: string;
  storeType: string;
  shipworksStore: string | null;
  name: string;
  supportEmail: string;
}
