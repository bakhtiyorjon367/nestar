import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_PROPERTIES } from './lib/config';

@Controller()
export class BatchController {
  constructor(private readonly batchService: BatchService) {}
  private logger:Logger = new Logger('SocketEventsGateway');

  // @Interval(5000)
  // hadnleInterval(){
  //   this.logger.debug("interval Test");
  // }

  @Timeout(1000)
  hadnleTimeout(){
    this.logger.debug("Timeout test");
  }

  @Cron("00 * * * * *", {name:BATCH_ROLLBACK})
  public async batchRollback(){
    try{
      this.logger["context"] = BATCH_ROLLBACK;
      this.logger.debug("EXECUTED");
  
      await this.batchService.batchRollback();
    }catch(err){
      this.logger.error(err);

    }
  }//_______________________________________________________________

  @Cron("20 * * * * *", {name:BATCH_TOP_PROPERTIES})
  public async batchProperties(){
    try{
      this.logger["context"] = BATCH_TOP_PROPERTIES;
      this.logger.debug("EXECUTED");
  
      await this.batchService.batchProperties();
    }catch(err){
      this.logger.error(err);
    }
  }//_______________________________________________________________

  @Cron("40 * * * * *", {name:BATCH_TOP_AGENTS})
  public async batchAgents(){
    try{
      this.logger["context"] = BATCH_TOP_AGENTS;
      this.logger.debug("EXECUTED");
  
      await this.batchService.batchAgents();
    }catch(err){
      this.logger.error(err);
    }
  }//_______________________________________________________________


  @Get()
  getHello(): string {
    return this.batchService.getHello();
  }
}

