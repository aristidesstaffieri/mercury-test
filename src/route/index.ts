import Fastify, { FastifyRequest } from 'fastify'
import helmet from '@fastify/helmet'

import { MercuryClient, NewSubscriptionPayload } from '../service/mercury'

const API_VERSION = 'v1'

export function initApiServer(mercuryClient: MercuryClient) {
  const server = Fastify({
    logger: true
  })

  server.register(helmet, { global: true })
  server.register((instance, _opts, next) => {
    instance.route({
      method: 'GET',
      url: '/ping',
      handler: async (_request, reply) => {
        reply.code(200).send('pong')
      }
    })
  
    instance.route({
      method: 'POST',
      url: '/subscription',
      schema: {
        body: {
          type: 'object',
          properties: {
            contract_id: { type: 'string' },
            max_single_size: { type: 'string' },
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              hello: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const { data, error } =  await mercuryClient.addNewSubscription(request.body as NewSubscriptionPayload)
        if (error) {
          reply.code(400).send(error)
        } else {
          reply.code(200).send(data)
        }
      }
    })

    instance.route({
      method: 'GET',
      url: '/subscription',
      handler: async (_request, reply) => {
        const { data, error } =  await mercuryClient.getSubscriptions()
        if (error) {
          reply.code(400).send(error)
        } else {
          reply.code(200).send(data)
        }
      }
    })

    instance.route({
      method: 'GET',
      url: '/subscription/:id',
      schema: {
        params: {
          id: { type: 'string' }
        }
      },
      handler: async (request: FastifyRequest<{Params: {id: string}}>, reply) => {
        const { id } = request.params
        const { data, error } =  await mercuryClient.getSubscriptionByID(id)
        if (error) {
          reply.code(400).send(error)
        } else {
          reply.code(200).send(data)
        }
      }
    })

    next()
  }, { prefix: `/api/${API_VERSION}`})

  return server
}