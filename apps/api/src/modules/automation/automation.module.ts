import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AgentController } from './agent.controller';
import { NeuralAgentService } from './neural-agent.service';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';
import { TalentModule } from '../talent/talent.module';

@Module({
  imports: [NotificationModule, AiModule, TalentModule],
  controllers: [AutomationController, AgentController],
  providers: [AutomationService, NeuralAgentService],
  exports: [AutomationService, NeuralAgentService],
})
export class AutomationModule {}
