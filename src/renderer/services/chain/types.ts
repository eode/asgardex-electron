import * as RD from '@devexperts/remote-data-ts'
import { Address, FeeOptionKey, Fees, Tx } from '@xchainjs/xchain-client'
import { Asset, BaseAmount, Chain } from '@xchainjs/xchain-util'
import * as O from 'fp-ts/lib/Option'
import * as Rx from 'rxjs'

import { Network } from '../../../shared/api/types'
import { LiveData } from '../../helpers/rx/liveData'
import { AssetWithDecimal } from '../../types/asgardex'
import { PoolAddress } from '../midgard/types'
import { ApiError, TxHashRD } from '../wallet/types'

export type TxTypes = 'DEPOSIT' | 'SWAP' | 'WITHDRAW' | 'UPGRADE'

export type Chain$ = Rx.Observable<O.Option<Chain>>

export type AssetWithDecimalLD = LiveData<Error, AssetWithDecimal>
export type AssetWithDecimalRD = RD.RemoteData<Error, AssetWithDecimal>

export type LoadFeesHandler = () => void

export type FeeRD = RD.RemoteData<Error, BaseAmount>
export type FeeLD = LiveData<Error, BaseAmount>

export type FeesRD = RD.RemoteData<Error, Fees>
export type FeesLD = LiveData<Error, Fees>

export type SwapFees = {
  inTx: BaseAmount
  outTx: BaseAmount
}

export type SwapFeesRD = RD.RemoteData<Error, SwapFees>
export type SwapFeesLD = LiveData<Error, SwapFees>

export type Memo = string
export type MemoRx = Rx.Observable<O.Option<Memo>>

export type SymDepositMemo = { rune: Memo; asset: Memo }
export type SymDepositMemoRx = Rx.Observable<O.Option<SymDepositMemo>>

/**
 * Deposit fees

 * One fee (asymmetrical deposit) or two fees (symmetrical deposit):
 *
 * thor: Fee for transaction on Thorchain. Needed for sym deposit txs. It's `O.none` for asym deposit txs
 * asset: Fee for transaction on asset chain
 */
export type DepositFees = { thor: O.Option<BaseAmount>; asset: BaseAmount }
export type DepositFeesRD = RD.RemoteData<Error, DepositFees>
export type DepositFeesLD = LiveData<Error, DepositFees>

export type SymDepositFeesHandler = (params: O.Option<SymDepositParams>) => DepositFeesLD
export type ReloadSymDepositFeesHandler = (params: O.Option<SymDepositParams>) => void

export type AsymDepositParams = {
  readonly poolAddress: PoolAddress
  readonly asset: Asset
  readonly amount: BaseAmount
  readonly memo: string
}

export type SymDepositAmounts = { rune: BaseAmount; asset: BaseAmount }

export type SymDepositParams = {
  readonly poolAddress: PoolAddress
  readonly asset: Asset
  readonly amounts: SymDepositAmounts
  readonly memos: SymDepositMemo
}

export type SendDepositTxParams = { chain: Chain; asset: Asset; poolAddress: string; amount: BaseAmount; memo: Memo }

export type SendTxParams = {
  asset: Asset
  recipient: Address
  amount: BaseAmount
  memo: Memo
  feeOptionKey?: FeeOptionKey
}

export type SendPoolTxParams = SendTxParams & {
  router: O.Option<Address>
}

export type LedgerAddressParams = { chain: Chain; network: Network }

/**
 * State to reflect status of a swap by doing different requests
 */
export type SwapState = {
  // Number of current step
  readonly step: number
  // Constant total amount of steps
  readonly stepsTotal: 3
  // swap transaction
  readonly swapTx: TxHashRD
  // RD of all requests
  readonly swap: RD.RemoteData<ApiError, boolean>
}

export type SwapState$ = Rx.Observable<SwapState>

/**
 * Parameters to send swap tx into (IN) a pool
 */
export type SwapTxParams = {
  readonly poolAddress: PoolAddress
  readonly asset: Asset
  readonly amount: BaseAmount
  readonly memo: string
}

export type SwapStateHandler = (p: SwapTxParams) => SwapState$

/**
 * Types of swap txs
 **/

export type SwapTxType = 'in' | ' out'

export type SwapOutTx = {
  readonly asset: Asset
  readonly memo: Memo
}
/**
 * Fees to swap txs (IN/OUT)
 */
export type SwapFeesParams = {
  /** Fee for pool tx sent into (IN) a pool */
  readonly inTx: SwapTxParams
  /** Fee for pool tx to sent OUT from a pool */
  readonly outTx: SwapOutTx
}

export type SwapFeesHandler = (p: O.Option<SwapFeesParams>) => SwapFeesLD

export type ReloadSwapFeesHandler = (p: O.Option<SwapFeesParams>) => void

/**
 * State to reflect status of an asym. deposit by doing different requests
 */
export type AsymDepositState = {
  // Number of current step
  readonly step: number
  // Constant total amount of steps
  readonly stepsTotal: 3
  // deposit transaction
  readonly depositTx: TxHashRD
  // RD of all requests
  readonly deposit: RD.RemoteData<ApiError, boolean>
}

export type AsymDepositState$ = Rx.Observable<AsymDepositState>

export type AsymDepositStateHandler = (p: AsymDepositParams) => AsymDepositState$

export type SymDepositValidationResult = { pool: boolean; node: boolean }
export type SymDepositTxs = { rune: TxHashRD; asset: TxHashRD }
export type SymDepositFinalityResult = { rune: Tx; asset: Tx }

/**
 * State to reflect status of a sym. deposit by doing different requests
 */
export type SymDepositState = {
  // Number of current step
  readonly step: number
  // Constant total amount of steps
  readonly stepsTotal: 4
  // deposit transactions
  readonly depositTxs: SymDepositTxs
  // RD for all needed steps
  readonly deposit: RD.RemoteData<ApiError, boolean>
}

export type SymDepositState$ = Rx.Observable<SymDepositState>

export type SymDepositStateHandler = (p: SymDepositParams) => SymDepositState$

/**
 * State to reflect status of a sym. deposit by doing different requests
 */
export type WithdrawState = {
  // Number of current step
  readonly step: number
  // Constant total amount of steps
  readonly stepsTotal: 3
  // withdraw transaction
  readonly withdrawTx: TxHashRD
  // RD for all needed steps
  readonly withdraw: RD.RemoteData<ApiError, boolean>
}

export type WithdrawState$ = Rx.Observable<WithdrawState>

export type SymWithdrawParams = {
  readonly memo: Memo
  readonly network: Network
}

export type SymWithdrawStateHandler = (p: SymWithdrawParams) => WithdrawState$

export type AsymWithdrawParams = {
  readonly poolAddress: PoolAddress
  readonly asset: Asset
  readonly memo: Memo
  readonly network: Network
}

export type AsymWithdrawStateHandler = (p: AsymWithdrawParams) => WithdrawState$

export type UpgradeRuneParams = {
  readonly poolAddresses: PoolAddress
  readonly asset: Asset
  readonly amount: BaseAmount
  readonly memo: string
}

/**
 * State to reflect status for upgrading Rune
 *
 * Three steps are needed:
 * 1. Health check (pool address)
 * 1. Send tx
 * 2. Check status of tx
 *
 */
export type UpgradeRuneTxState = {
  // State of steps (current step + total number of steps)
  readonly steps: { current: number; readonly total: 3 }
  // RD of all steps
  readonly status: TxHashRD
}

export type UpgradeRuneTxState$ = Rx.Observable<UpgradeRuneTxState>

/**
 * State to reflect status for sending
 *
 * Three steps are needed:
 * 1. Send tx
 * 2. Check status of tx
 *
 */
export type SendTxState = {
  // State of steps (current step + total number of steps)
  readonly steps: { current: number; readonly total: 2 }
  // RD of all steps
  readonly status: TxHashRD
}

export type SendTxState$ = Rx.Observable<SendTxState>

export type SendTxStateHandler = (p: SendTxParams) => SendTxState$
