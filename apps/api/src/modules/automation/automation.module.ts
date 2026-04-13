import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { AgentController } from './agent.controller';
import { ConnectController } from './connect.controller';
import { NeuralAgentService } from './neural-agent.service';
import { ConnectService } from './connect.service';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';
import { TalentModule } from '../talent/talent.module';

import { SingularityService } from './singularity.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { ChronologyService } from '../project/chronology.service';
import { DocService } from '../doc/doc.service';

@Module({
  imports: [NotificationModule, AiModule, TalentModule],
  controllers: [AutomationController, AgentController, ConnectController],
  providers: [
    AutomationService,
    NeuralAgentService,
    ConnectService,
    SingularityService,
    DiagnosisService,
    ChronologyService,
    DocService,
  ],
  exports: [AutomationService, NeuralAgentService, ConnectService, SingularityService],
})
export class AutomationModule {}
