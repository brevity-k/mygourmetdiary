import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBinderDto } from './dto/create-binder.dto';
import { UpdateBinderDto } from './dto/update-binder.dto';

@Injectable()
export class BindersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOwner(ownerId: string) {
    return this.prisma.binder.findMany({
      where: { ownerId },
      include: { _count: { select: { notes: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string, userId: string) {
    const binder = await this.prisma.binder.findUnique({
      where: { id },
      include: { _count: { select: { notes: true } } },
    });
    if (!binder) throw new NotFoundException('Binder not found');
    if (binder.ownerId !== userId) throw new ForbiddenException();
    return binder;
  }

  async create(ownerId: string, dto: CreateBinderDto) {
    return this.prisma.binder.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        visibility: dto.visibility,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateBinderDto) {
    const binder = await this.findById(id, userId);
    return this.prisma.binder.update({
      where: { id: binder.id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const binder = await this.findById(id, userId);
    if (binder.isDefault) {
      throw new BadRequestException('Cannot delete default binders');
    }
    await this.prisma.binder.delete({ where: { id: binder.id } });
  }
}
