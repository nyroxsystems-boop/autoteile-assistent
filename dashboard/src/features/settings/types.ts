export type PriceProfile = {
  id: 'standard' | 'workshop_basic' | 'workshop_pro' | 'partner';
  name: string;
  description: string;
  margin: number; // 0.40 for 40%
  isDefault?: boolean;
};

export const defaultPriceProfiles: PriceProfile[] = [
  {
    id: 'standard',
    name: 'Standard (Endkunde)',
    description: 'Standard-Verkaufspreis an Endkunden.',
    margin: 0.4,
    isDefault: true
  },
  {
    id: 'workshop_basic',
    name: 'Werkstatt Basic',
    description: 'Rabattierter Preis für Mechaniker und kleine Werkstätten.',
    margin: 0.28
  },
  {
    id: 'workshop_pro',
    name: 'Werkstatt Pro',
    description: 'Partnerkondition für größere Werkstätten und Betriebe.',
    margin: 0.22
  },
  {
    id: 'partner',
    name: 'Händler / Partner',
    description: 'Niedrigere Marge für Händlerkollegen und B2B-Partner.',
    margin: 0.1
  }
];
