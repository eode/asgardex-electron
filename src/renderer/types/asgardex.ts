import { BaseAmount, Asset, Chain } from '@xchainjs/xchain-util'
import { Option } from 'fp-ts/lib/Option'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FixmeType = any

export type Pair = {
  source: Option<string>
  target: Option<string>
}

export type AssetWithAmount = {
  asset: Asset
  amount: BaseAmount
}

export type AssetWithDecimal = {
  asset: Asset
  decimal: number
}

export type DepositType = 'sym' | 'asym'
export type WithdrawType = 'sym' | 'asym'

export const MAX_VALUE = 100

export type TxStatus = {
  /**
   *  Modal state
   * true -> `opened` modal
   * `false` -> `closed` modal
   */
  readonly modal: boolean
  /**
   *  Current step value. It can be something between 0 - `MAX_VALUE` to show a progress of requests
   */
  readonly value: number
  /**
   *  Start time of first request - undefined by default
   */
  readonly startTime?: number
  /**
   * Status of `TxTimer` component (it could be any other component, too)
   * `true` -> `TxTimer` component is counting
   * `false` -> <TxTimer /> component is not counting
   */
  readonly status: boolean
  /**
   * Transaction hash - optional
   */
  readonly hash?: string
}

export type ChainValues<T> = {
  [k in Chain]?: T[]
}
