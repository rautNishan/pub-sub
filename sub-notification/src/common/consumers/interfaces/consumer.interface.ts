export interface BrokerInterface {
  consume(): Promise<void>;
}


