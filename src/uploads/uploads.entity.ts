import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('uploads')
export class UploadsEntity {
    @PrimaryGeneratedColumn() id: string;
}
