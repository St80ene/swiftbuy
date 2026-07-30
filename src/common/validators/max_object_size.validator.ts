import { registerDecorator } from 'class-validator';

export function MaxObjectSize(acceptedSize: number) {
  const maxObjectSizeValidator = {
    validate: (value: any) => {
      if (typeof value !== 'object' || value === null) {
        return false; // Not an object
      }

      const size = Object.keys(value as Record<string, unknown>).length;
      return size <= acceptedSize;
    },
    defaultMessage: () =>
      `Object size exceeds the maximum allowed size of ${acceptedSize} bytes.`,
  };

  return function (object: object, propertyKey: string) {
    registerDecorator({
      name: 'maxObjectSize',
      target: object.constructor,
      propertyName: propertyKey,
      options: { message: maxObjectSizeValidator.defaultMessage() },
      validator: maxObjectSizeValidator,
    });
  };
}
