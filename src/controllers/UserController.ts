import { Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../helpers/api-erros";
import { userRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";

export class UserController {
  async createUser(req: Request, res: Response) {
    const { email, name, password, role } = req.body;

    const userExists = await userRepository.findOneBy({ email });

    if (userExists) {
      throw new BadRequestError("Email já cadastrado");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = userRepository.create({
      name,
      email,
      password: hashPassword,
      role,
    });

    await userRepository.save(newUser);
    const { password: _, ...user } = newUser;

    return res.status(201).json(user);
  }

  async getUsers(req: Request, res: Response) {
    const users = await userRepository.find();
    if (req.user.role !== "1") {
      throw new UnauthorizedError(
        "Você Não tem permissão para realizan esta operação!"
      );
    }

    if (!users) {
      throw new BadRequestError("Não encontramos usuários cadastrados");
    }
    return res.status(201).json(users);
  }
}
