import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException, // ✅ NUEVO: duplicados
  InternalServerErrorException, // ✅ NUEVO: otros errores
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role, Prisma } from '@prisma/client'; // ✅ NUEVO: Prisma para detectar P2002

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ===============================================================
  // 0. Resolver ID de usuario a partir del currentUser del token
  // ===============================================================
  private async resolveUserId(currentUser: any): Promise<number | null> {
    const directId =
      currentUser?.userId ?? currentUser?.id ?? currentUser?.sub;

    if (directId) return directId;

    if (currentUser?.username) {
      const user = await this.prisma.user.findUnique({
        where: { username: currentUser.username },
        select: { id: true },
      });
      return user?.id ?? null;
    }

    return null;
  }

  // ===============================================================
  // 1. Buscar usuario por username (para login)
  // ===============================================================
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // ===============================================================
  // 2. Listar usuarios (ADMIN ve todos, DIRECTOR solo los suyos)
  // ===============================================================
  async findAll(currentUser: any) {
    console.log('currentUser en findAll:', currentUser);

    const role: Role = currentUser.role;

    // 🟥 ADMIN → ve todos los usuarios
    if (role === Role.ADMIN) {
      return this.prisma.user.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          username: true,
          nombreCompleto: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // 🟨 DIRECTOR → ve solo los usuarios que él creó (ownerDirectorId)
    if (role === Role.DIRECTOR) {
      const directorId = await this.resolveUserId(currentUser);

      if (!directorId) {
        return [];
      }

      return this.prisma.user.findMany({
        where: { ownerDirectorId: directorId },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          username: true,
          nombreCompleto: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    throw new ForbiddenException('No tienes permisos para ver usuarios.');
  }

  // ===============================================================
  // 3. Obtener un usuario por ID
  // ===============================================================
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nombreCompleto: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    return user;
  }

  // ===============================================================
  // 4. Crear usuario (ADMIN ilimitado, DIRECTOR con límite)
  //    ✅ AHORA CON TRY/CATCH + P2002 + DEFAULTS
  // ===============================================================
  async create(
    data: {
      username: string;
      password: string;
      nombreCompleto: string;
      email: string;
      phone: string;
      role: Role;
      active: boolean;
      maxUsers?: number;
      maxObras?: number;
    },
    creator: any,
  ) {
    if (!creator) {
      throw new ForbiddenException('No autenticado.');
    }

    const creatorRole: Role = creator.role;

    // 1️⃣ Si el creador es DIRECTOR → validar roles y límite
    if (creatorRole === Role.DIRECTOR) {
      if (data.role === Role.ADMIN || data.role === Role.DIRECTOR) {
        throw new ForbiddenException(
          'Un Director no puede crear usuarios ADMIN o DIRECTOR.',
        );
      }

      const directorId = await this.resolveUserId(creator);
      if (!directorId) {
        throw new ForbiddenException('No se pudo determinar el ID del director.');
      }

      const directorEntity = await this.prisma.user.findUnique({
        where: { id: directorId },
        select: { maxUsers: true },
      });

      const maxUsers = directorEntity?.maxUsers ?? creator.maxUsers ?? 3;

      const totalUsers = await this.prisma.user.count({
        where: { ownerDirectorId: directorId },
      });

      if (totalUsers >= maxUsers) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${maxUsers} usuarios permitidos.`,
        );
      }
    }

    // 2️⃣ Hash de contraseña
    const hash = await bcrypt.hash(data.password, 10);

    // 3️⃣ Datos base del usuario
    // ✅ Defaults por seguridad: evita errores si la DB exige valores
    const userData: any = {
      username: data.username,
      nombreCompleto: data.nombreCompleto,
      hash,
      role: data.role,
      active: data.active,
      maxUsers: 0,
      maxObras: 0,
    };

    if (data.email && data.email.trim() !== '') {
      userData.email = data.email.trim();
    }

    if (data.phone && data.phone.trim() !== '') {
      userData.phone = data.phone.trim();
    }

    // 4️⃣ ADMIN definiendo límites para DIRECTOR
    if (creatorRole === Role.ADMIN && data.role === Role.DIRECTOR) {
      userData.maxUsers = data.maxUsers ?? 3;
      userData.maxObras = data.maxObras ?? 1;
    }

    // 5️⃣ Si el creador es DIRECTOR → asignamos ownerDirectorId correctamente
    if (creatorRole === Role.DIRECTOR) {
      const directorId = await this.resolveUserId(creator);
      if (directorId) {
        userData.ownerDirectorId = directorId;
      }
    }

    // 6️⃣ Crear usuario con manejo de errores
    try {
      return await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          username: true,
          nombreCompleto: true,
          email: true,
          phone: true,
          role: true,
          active: true,
        },
      });
    } catch (error: any) {
      // ✅ Prisma unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];

          if (target.includes('email')) {
            throw new ConflictException('El correo electrónico ya está registrado.');
          }
          if (target.includes('username')) {
            throw new ConflictException('El usuario ya existe.');
          }
          if (target.includes('phone')) {
            throw new ConflictException('El teléfono ya está registrado.');
          }

          throw new ConflictException(
            'Ya existe un registro con estos datos (correo/usuario/teléfono).',
          );
        }
      }

      console.error('❌ ERROR CRÍTICO AL CREAR USUARIO:', error);
      throw new InternalServerErrorException(
        'Error interno al guardar usuario. Revisa la consola.',
      );
    }
  }

  // ===============================================================
  // 5. Actualizar usuario (SIN CAMBIOS FUNCIONALES)
  // ===============================================================
  async update(
    id: number,
    data: Partial<{
      username: string;
      password: string;
      nombreCompleto: string;
      role: Role;
      active: boolean;
      email: string;
      phone: string;
      maxUsers: number;
      maxObras: number;
    }>,
  ) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.hash = await bcrypt.hash(data.password, 10);
    }
    delete updateData.password;

    if (data.maxUsers !== undefined) {
      updateData.maxUsers = data.maxUsers;
    }
    if (data.maxObras !== undefined) {
      updateData.maxObras = data.maxObras;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        nombreCompleto: true,
        email: true,
        phone: true,
        role: true,
        active: true,
      },
    });
  }

  // ===============================================================
  // 6. Eliminar usuario
  // ===============================================================
  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true },
    });
  }
}
