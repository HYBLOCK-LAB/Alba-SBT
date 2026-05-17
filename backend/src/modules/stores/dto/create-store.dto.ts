export class CreateStoreDto {
  managerId!: string;
  name!: string;
  category!: 'fnb' | 'retail' | 'production' | 'service' | 'culture' | 'office' | 'education';
  subCategory!: string;
  address!: string;
  latitude!: number;
  longitude!: number;
  gpsRadiusMeters?: number;
  qrValidityStartHour!: number;
  qrValidityEndHour!: number;
  businessNumber?: string;
  contact?: string;
}
