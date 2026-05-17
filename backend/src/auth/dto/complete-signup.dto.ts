import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

class OptionalStringTransformer {
  static toNullIfEmpty(value: unknown) {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}

export class CompleteSignupDto {
  @IsString()
  @IsNotEmpty({ message: 'signupToken이 필요합니다' })
  signupToken!: string;

  @IsEnum(['worker', 'manager'], { message: 'accountType은 worker 또는 manager여야 합니다' })
  accountType!: 'worker' | 'manager';

  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요' })
  name!: string;

  @IsOptional()
  @Transform(({ value }) => OptionalStringTransformer.toNullIfEmpty(value))
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다' })
  email?: string | null;

  @IsOptional()
  @Transform(({ value }) => OptionalStringTransformer.toNullIfEmpty(value))
  @IsPhoneNumber('KR', { message: '유효한 휴대폰 번호 형식이 아닙니다' })
  phone?: string | null;
}
