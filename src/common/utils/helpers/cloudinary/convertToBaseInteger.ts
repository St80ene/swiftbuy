import { UomDisplayName } from '../../../resources/products/entities/product.entity';

function convertToIntegerBaseUnit(
  quantity: number,
  displayUnit: UomDisplayName,
): number {
  switch (displayUnit) {
    case UomDisplayName.KG:
      return Math.round(quantity * 1000);

    case UomDisplayName.L:
      return Math.round(quantity * 1000);

    case UomDisplayName.G:
    case UomDisplayName.ML:
    case UomDisplayName.PCS:
      return Math.round(quantity);
  }
}

export default convertToIntegerBaseUnit;
