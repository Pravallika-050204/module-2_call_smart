import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceModule } from '../../../modules/m02-conversation-intelligence/m02-conversation-intelligence.module';
import { M2Module } from '../../../modules/m2/m2.module';

@Module({
  imports: [
    M02ConversationIntelligenceModule,
    M2Module,
  ],
})
export class AppModule {}

