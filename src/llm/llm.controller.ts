import { Body, Controller, Post } from '@nestjs/common';
import { LlmService } from './llm.service';
import { PromptDto } from './dto/prompt.dto';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post()
  async llmTalk(@Body() promptDto: PromptDto) {
    return this.llmService.llmTalk(promptDto);
  }
}
