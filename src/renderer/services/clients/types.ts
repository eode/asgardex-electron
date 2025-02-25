import * as RD from '@devexperts/remote-data-ts'
import { Address, TxHash, XChainClient } from '@xchainjs/xchain-client'
import { TxsPage, Fees } from '@xchainjs/xchain-client'
import { Asset } from '@xchainjs/xchain-util'
import * as E from 'fp-ts/lib/Either'
import { getEitherM } from 'fp-ts/lib/EitherT'
import * as O from 'fp-ts/lib/Option'
import { Option, option } from 'fp-ts/lib/Option'
import * as Rx from 'rxjs'

import { LiveData } from '../../helpers/rx/liveData'
import { WalletBalance } from '../../types/wallet'
import { ApiError, TxLD } from '../wallet/types'
import { TxHashLD } from '../wallet/types'
/**
 * Three States:
 * (1) None -> no client has been instantiated
 * (2) Some(Right) -> A client has been instantiated
 * (3) Some(Left) -> An error while trying to instantiate a client
 */
export type ClientState<C> = Option<E.Either<Error, C>>
export type ClientState$<C> = Rx.Observable<ClientState<C>>

// Something like `EitherT<Option>` Monad
export const ClientStateM = getEitherM(option)

export type ClientStateForViews = 'notready' | 'ready' | 'error'

export type XChainClient$ = Rx.Observable<O.Option<XChainClient>>

export type Client$<C> = Rx.Observable<O.Option<C>>

export type FeesRD = RD.RemoteData<Error, Fees>
export type FeesLD = LiveData<Error, Fees>

export type LoadTxsParams = {
  limit: number
  offset: number
}

export type TxsParams = { asset: O.Option<Asset>; walletAddress: O.Option<string> } & LoadTxsParams

export type TxsPageRD = RD.RemoteData<ApiError, TxsPage>
export type TxsPageLD = LiveData<ApiError, TxsPage>

export type WalletBalanceRD = RD.RemoteData<ApiError, WalletBalance>
export type WalletBalanceLD = LiveData<ApiError, WalletBalance>

export type WalletBalances = WalletBalance[]
export type WalletBalancesRD = RD.RemoteData<ApiError, WalletBalances>
export type WalletBalancesLD = LiveData<ApiError, WalletBalances>

export type ExplorerUrl$ = Rx.Observable<O.Option<string>>
export type GetExplorerTxUrl = (txHash: string) => string
export type GetExplorerAddressUrl = (address: string) => string

export type GetExplorerTxUrl$ = Rx.Observable<O.Option<GetExplorerTxUrl>>

export type GetExplorerAddressUrl$ = Rx.Observable<O.Option<GetExplorerAddressUrl>>

export type Address$ = Rx.Observable<O.Option<Address>>

export type TransactionService<T> = {
  txRD$: TxHashLD
  subscribeTx: (_: T) => Rx.Subscription
  sendTx: (_: T) => TxHashLD
  resetTx: () => void
  txs$: (_: TxsParams) => TxsPageLD
  tx$: (txHash: TxHash) => TxLD
  txStatus$: (txHash: TxHash, assetAddress: O.Option<Address>) => TxLD
}

/**
 *
 * FeesService<FeeParams>
 *
 * According to the XChainClient's interface
 * `Client.getFees` accept an object of `FeeParams`, which might be overriden by clients.
 * @see https://github.com/xchainjs/xchainjs-lib/blob/master/packages/xchain-client/src/types.ts
 *
 * In common-client case, this parameter might be extended amd we need a generic type
 * to have an access to params "real" type value for specific chain
 * @example ETH client has extended `FeesParams` interface
 * @see https://github.com/xchainjs/xchainjs-lib/blob/master/packages/xchain-ethereum/src/types/client-types.ts
 */

export type FeesService<T> = {
  reloadFees: (_?: T) => void
  fees$: (_?: T) => FeesLD
  reloadFees$: Rx.Observable<T | undefined>
}
