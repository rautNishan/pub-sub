export interface NotificationMessage {
  id: string;
  user_id: string;
  type: string;
  payload: any;
  status: string;
  created_at: string;
  processed_at?: string;
}
