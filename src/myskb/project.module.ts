import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySkbProject } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectService } from './project.service';
import { MySkbProjectController } from './project.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MySkbProject, Business])],
    providers: [MySkbProjectService],
    controllers: [MySkbProjectController],
    exports: [MySkbProjectService],
})
export class MySkbProjectModule { }
