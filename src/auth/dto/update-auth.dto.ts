import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './password.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
