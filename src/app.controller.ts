import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello(): string {
        console.log('🔥 Hot reload is working!s');
        return 'Hello World with Hot Reload!';
    }
}