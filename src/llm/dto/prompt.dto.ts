import { IsString } from 'class-validator';

export class PromptDto {
  @IsString()
  prompt?: string;
}
