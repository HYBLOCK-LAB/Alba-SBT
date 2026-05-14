import { Matches } from 'class-validator';

const DB_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function IsDbUuid() {
  return Matches(DB_UUID_PATTERN, {
    message: '$property must be a database UUID',
  });
}

