import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySkbProject } from './project.entity';
import { Business } from '../business/registration/business.entity';
import { MySkbProjectOwner } from './project-owner.entity';
import { MySkbProjectService } from './project.service';
import { MySkbProjectController } from './project.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MySkbProject, MySkbProjectOwner, Business])],
    providers: [MySkbProjectService],
    controllers: [MySkbProjectController],
    exports: [MySkbProjectService],
})
export class MySkbProjectModule { }
