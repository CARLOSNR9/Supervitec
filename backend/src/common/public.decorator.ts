// Archivo: backend/src/common/public.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// El decorador @Public() marca un handler como accesible públicamente (sin token)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);