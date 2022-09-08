import { Injectable } from '@nestjs/common';


@Injectable()
export class SeedService {
  execute() {
    return 'This action adds a new seed';
  }
}
