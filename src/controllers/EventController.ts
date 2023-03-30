import { Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../helpers/api-erros";
import { eventRepository } from "../repositories/eventRepository";

export class EventController {
  async createEvent(req: Request, res: Response) {
    const { name, description, local, type, date, agents, avatar, url } =
      req.body;
    const user = req.user;
    const existsEvent = await eventRepository.findOneBy({ name });

    if (existsEvent) {
      throw new BadRequestError(
        "Já existe um evento com o mesmo nome cadastrado"
      );
    }

    if (
      !name ||
      !description ||
      !local ||
      !type ||
      !date ||
      !agents ||
      !avatar ||
      !url
    ) {
      throw new BadRequestError("Preencha os campos obrigatórios");
    }

    const { role: _, ...userData } = user;
    const newEvent = eventRepository.create({
      name,
      description,
      local,
      type,
      date,
      agents,
      avatar,
      url,
      user: userData,
    });

    await eventRepository.save(newEvent);
    return res.status(201).json(newEvent);
  }

  async listEvents(req: Request, res: Response) {
    const { name } = req.params;
    if (name) {
      const existsEvent = await eventRepository.findOneBy({ name });
      if (!existsEvent) {
        throw new NotFoundError("O evento não foi encontrado");
      }
      return res.status(201).json([existsEvent]);
    } else {
      const events = await eventRepository.find({
        relations: {
          participants: true,
        },
      });
      return res.status(201).json(events);
    }
  }

  async getEventById(req: Request, res: Response) {
    const { id } = req.params;
    const n = parseInt(id);
    if (id) {
      const existsEvent = await eventRepository.findOne({
        relations: {
          participants: true,
        },
        where: {
          id: n,
        },
      });
      if (!existsEvent) {
        throw new NotFoundError("O evento não foi encontrado");
      }
      return res.status(201).json([existsEvent]);
    }
  }

  async getMyEvents(req: Request, res: Response) {
    const myId = req.user.id;
    if (!myId) {
      throw new UnauthorizedError("Você precisa estar logado para realizar esta ação");
    }
    const mysEvents = await eventRepository.find({
      relations: {
        user: true,
        participants: true
      },
      where: {
        user: req.user,
      },
    });

    if (mysEvents.length === 0) {
      throw new NotFoundError("Você ainda não possue eventos cadastrados");
    }

    return res.status(201).json(mysEvents);
  }
}
