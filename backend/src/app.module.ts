import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { SupabaseModule } from './infra/supabase/supabase.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { StoresModule } from './modules/stores/stores.module.js';
import { StaffAssignmentsModule } from './modules/staff-assignments/staff-assignments.module.js';
import { LevelUpModule } from './modules/level-up/level-up.module.js';

@Module({
  imports: [
    SupabaseModule,
    UsersModule,
    StoresModule,
    StaffAssignmentsModule,
    LevelUpModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
