import { Injectable } from '@nestjs/common';
import { PromptDto } from './dto/prompt.dto';
import { ChatGroq } from '@langchain/groq';
import { ConfigService } from '@nestjs/config';
import { PromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { requestInterface } from 'src/interfaces/dto.interface';

@Injectable()
export class LlmService {
  constructor(private configService: ConfigService) {}

  async fetchDtoData() {
    try {
      const response = await axios.get('http://localhost:3000/social/schema');
      return response;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async fetchPaginatedData(page = 1, limit = 10, body: any) {
    try {
      const response = await axios.post(
        'http://localhost:3000/social/user',
        body,
        {
          params: {
            page,
            limit,
          },
        },
      );

      return response;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async llmTalk(promptDto: PromptDto) {
    //get DTO
    const Dtos = await this.fetchDtoData();

    const model = new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });

    // get req body from llm
    const prompt = new PromptTemplate({
      inputVariables: ['UserPrompt', 'Dtos'],
      template: `You are given the following:

              1. Dto schema.
              2. A user prompt that gives context about what request body to make.

              Your task:

              - reform a request body that i can use to get the data the user need from another API.
              - calculate the pagination to return the data user want only.
              - Return a JSON object with the following structure:

              Example output:

              {{
                "pagination":{{
                    "limit":2,
                    "paage":1
                }},
                "body":{{
                    "userName"?:"alice",
                    "age"?:20
                    "sorting":"ASC",
                    "sortingBy"?:"age"
                }}
              }}

              Rules:
              
              - Follow the structure strictly.

              DtoSchema:
              {Dtos}

              User Prompt:
              {UserPrompt}`,
    });

    const parser = new JsonOutputParser();

    const chain = prompt.pipe(model).pipe(parser);

    const reqOutput = (await chain.invoke({
      UserPrompt: promptDto.prompt,
      Dtos: Dtos?.data,
    })) as requestInterface;

    //make req to get data
    const data = await this.fetchPaginatedData(
      reqOutput.pagination.page,
      reqOutput.pagination.limit,
      reqOutput.body,
    );
    console.log(data?.data);
    // use data to reform answer with llm
    const answerPrompt = new PromptTemplate({
      inputVariables: ['UserPrompt', 'Data'],
      template: `You are given the following:

              1. A user prompt that gives context about the answer you make.
              2. Data that you should use to reform the answer.

              Your task:

              - reform an answer for the question i gave you using the data.
              - Return a text with less explaination.
              - if the user gave you a phrase like this :
               text text text {{word}} text
               use the data you have to complete this phrase

              Rules:
              
              - return all the data you got
              - if you return an object or a list display it in a good form
              - Follow the structure strictly.

              Data:
              {Data}

              User Prompt:
              {UserPrompt}`,
    });

    const formatted = await answerPrompt.format({
      UserPrompt: promptDto.prompt,
      Data: data?.data,
    });
    const answer = await model.invoke(formatted);

    return answer.content;
  }
}
