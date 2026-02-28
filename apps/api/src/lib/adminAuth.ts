import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";

export function requireAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  const token = request.headers["x-admin-token"];
  if (typeof token !== "string" || token !== config.adminToken) {
    reply.code(401).send({
      message: "Unauthorized. Supply a valid x-admin-token header."
    });
    return false;
  }

  return true;
}

