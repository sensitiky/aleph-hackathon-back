export enum CreditType {
  FORESTRY = 0,
  RENEWABLE_ENERGY = 1,
  ENERGY_EFFICIENCY = 2,
  WASTE_MANAGEMENT = 3,
  AGRICULTURE = 4,
  BLUE_CARBON = 5,
  DIRECT_CAPTURE = 6,
  OTHER = 7,
}

export const CreditTypeLabels = {
  [CreditType.FORESTRY]: 'Proyectos Forestales',
  [CreditType.RENEWABLE_ENERGY]: 'Energía Renovable',
  [CreditType.ENERGY_EFFICIENCY]: 'Eficiencia Energética',
  [CreditType.WASTE_MANAGEMENT]: 'Gestión de Residuos',
  [CreditType.AGRICULTURE]: 'Agricultura Sostenible',
  [CreditType.BLUE_CARBON]: 'Carbono Azul',
  [CreditType.DIRECT_CAPTURE]: 'Captura Directa de CO2',
  [CreditType.OTHER]: 'Otros',
};