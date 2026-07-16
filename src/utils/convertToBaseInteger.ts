import { UomType } from '../resources/products/entities/product.entity';

function convertToIntegerBaseUnit(quantity: number, uomType: UomType): number {
  const numericQty = Number(quantity) || 0;
  // If weight (kg -> g) or volume (L -> ml), scale up by 1000 to drop decimals
  if (uomType === UomType.WEIGHT || uomType === UomType.VOLUME) {
    return Math.round(numericQty * 1000);
  }
  return Math.round(numericQty);
}

export default convertToIntegerBaseUnit;
