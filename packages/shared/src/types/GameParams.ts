export type GameParams = {
  gamemode: 'solo' | 'multi';
  network: 'metro';
  trip: string;
  rules: {
    easy: boolean;
  }
}