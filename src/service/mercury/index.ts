import { Client } from '@urql/core'
import axios from 'axios'
import { Logger } from 'pino'
import { nativeToScVal } from 'soroban-client'
import { mutation, query } from './queries'

export interface NewSubscriptionPayload {
  contract_id?: string
  max_single_size: number
  [key: string]: string | number | undefined
}

interface MercurySession {
  baseUrl: string
  token: string
  email: string
  password: string
}

export class MercuryClient {
  urqlClient: Client
  mercurySession: MercurySession
  mercuryNewSubUrl: string
  logger: Logger

  constructor(
    mercurySession: MercurySession,
    urqlClient: Client, 
    logger: Logger
  ) {
    this.mercurySession = mercurySession
    this.mercuryNewSubUrl = `${mercurySession.baseUrl}:3030/newsubscription`
    this.urqlClient = urqlClient
    this.logger = logger
  }

  renewMercuryToken = async () => {
    try {
      const { data } = await this.urqlClient.query(
        mutation.authenticate, 
        { email: this.mercurySession.email, password: this.mercurySession.password }
      );
      this.renewMercuryToken = data.authenticate.jwtToken

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  getSubscriptionByID = async (id: string) => {
    try {
      const data = await this.urqlClient.query(query.subscriptionById, { id });

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  getSubscriptions = async () => {
    try {
      const data = await this.urqlClient.query(query.allSubscriptions, {});

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  addNewSubscription = async (subscription: NewSubscriptionPayload) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${this.mercuryToken}`
        }
      }

      const { data } = await axios.post(this.mercuryNewSubUrl, subscription, config)

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  addNewTokenSubscription = async (contractId: string, pubKey: string) => {
    // Token transfer topics are - 1: transfer, 2: from, 3: to, 4: assetName, data(amount)
    const transferToSub = {
      contract_id: contractId,
      max_single_size: 200,
      topic1: nativeToScVal('transfer').toXDR(),
      topic2: nativeToScVal(pubKey).toXDR(),
    }
    const transferFromSub = {
      contract_id: contractId,
      max_single_size: 200,
      topic1: nativeToScVal('transfer').toXDR(),
      topic3: nativeToScVal(pubKey).toXDR(),
    }

    const mintSub = {
      contract_id: contractId,
      max_single_size: 200,
      topic1: nativeToScVal('mint').toXDR()
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${this.mercuryToken}`
        }
      }

      const { data: transferFromRes } = await axios.post(this.mercuryNewSubUrl, transferToSub, config)
      const { data: transferToRes } = await axios.post(this.mercuryNewSubUrl, transferFromSub, config)
      const { data: mintRes } = await axios.post(this.mercuryNewSubUrl, mintSub, config)

      if (!transferFromRes || !transferToRes || !mintRes) {
        throw new Error('Failed to subscribe to token events')
      }

      return {
        data: true,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  addNewAccountSubscription = async (pubKey: string) => {
    try {
      const data = await this.urqlClient.query(mutation.newAccountSubscription, { pubKey });

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }

  getAccountHistory = async (pubKey: string) => { 
    try {
      const data = await this.urqlClient.query(query.getAccountHistory, {publicKeyText: pubKey});

      return {
        data,
        error: null
      }
    } catch (error) {
      const _error = JSON.stringify(error)
      this.logger.error(_error)
      return {
        data: null,
        error: _error
      }
    }
  }
}