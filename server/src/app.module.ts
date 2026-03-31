import { Module } from '@nestjs/common';

import { AccountsModule } from './accounts/accounts.module';
import { PrismaService } from 'prisma/prisma.server';

@Module({
  imports: [AccountsModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
