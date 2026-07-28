import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import {
  UomType,
  UomBaseName,
  UomDisplayName,
} from '../../resources/products/entities/product.entity';

export function IsValidUom(validationOptions?: ValidationOptions) {
  const VALID_UOM_TYPES = Object.values(UomType) as UomType[];
  const VALID_BASE_NAMES = Object.values(UomBaseName) as UomBaseName[];
  const VALID_DISPLAY_NAMES = Object.values(UomDisplayName) as UomDisplayName[];

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidUom',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const dto = args.object as {
            uom_type: UomType;
            uom_base_name: UomBaseName;
            uom_display_name: UomDisplayName;
          };

          if (!VALID_UOM_TYPES.includes(dto.uom_type)) {
            return true;
          }

          if (!VALID_BASE_NAMES.includes(dto.uom_base_name)) {
            return true;
          }

          if (!VALID_DISPLAY_NAMES.includes(dto.uom_display_name)) {
            return true;
          }

          switch (dto.uom_type) {
            case UomType.UNIT:
              return (
                dto.uom_base_name === UomBaseName.PCS &&
                dto.uom_display_name === UomDisplayName.PCS
              );

            case UomType.WEIGHT:
              return (
                dto.uom_base_name === UomBaseName.G &&
                [UomDisplayName.G, UomDisplayName.KG].includes(
                  dto.uom_display_name,
                )
              );

            case UomType.VOLUME:
              return (
                dto.uom_base_name === UomBaseName.ML &&
                [UomDisplayName.ML, UomDisplayName.L].includes(
                  dto.uom_display_name,
                )
              );

            default:
              return false;
          }
        },
      },
    });
  };
}
