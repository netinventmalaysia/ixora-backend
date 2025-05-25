import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Uploads')
export class UploadsEntity {
    @PrimaryGeneratedColumn() id:string;
}
