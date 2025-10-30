export interface PairingResult {
  groups: number[][];
}

export interface PairingEvent {
  id: number;
  organization_id: number;
  title: string;
  description: string;
  image_url: string;      // keep snake_case if backend sends it that way
  start_date: string;     // will come over JSON as ISO string
  end_date: string;
  is_active: boolean;
  participants: number[];
  matches: PairingResult;
}