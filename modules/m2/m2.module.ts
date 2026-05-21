import { Module } from '@nestjs/common';
import { M2Controller } from './controllers/m2.controller';
import { M2Service } from './services/m2.service';
import { M2Repository } from './repositories/m2.repository';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';
import { M02ConversationIntelligenceModule } from '../m02-conversation-intelligence/m02-conversation-intelligence.module';

@Module({
  imports: [
    EventPublisherModule,
    M02ConversationIntelligenceModule,
  ],
  controllers: [M2Controller],
  providers: [M2Service, M2Repository],
  exports: [M2Service],
})
export class M2Module {}
