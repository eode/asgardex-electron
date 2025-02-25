import * as RD from '@devexperts/remote-data-ts'
import { ETHAddress } from '@xchainjs/xchain-ethereum'
import {
  BNBChain,
  THORChain,
  BTCChain,
  baseAmount,
  ETHChain,
  CosmosChain,
  PolkadotChain,
  BCHChain,
  LTCChain
} from '@xchainjs/xchain-util'
import BigNumber from 'bignumber.js'
import * as FP from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as Rx from 'rxjs'
import * as RxOp from 'rxjs/operators'

import { getEthTokenAddress, isEthAsset } from '../../../helpers/assetHelper'
import { isEthChain } from '../../../helpers/chainHelper'
import { eqChain } from '../../../helpers/fp/eq'
import { liveData } from '../../../helpers/rx/liveData'
import { observableState } from '../../../helpers/stateHelper'
import * as BNB from '../../binance'
import * as BTC from '../../bitcoin'
import * as BCH from '../../bitcoincash'
import { ethRouterABI } from '../../const'
import * as ETH from '../../ethereum'
import * as LTC from '../../litecoin'
import * as THOR from '../../thorchain'
import { FeeOptionKeys, ZERO_SWAP_FEES } from '../const'
import { FeeLD, SwapFeesHandler, SwapFeesParams, SwapOutTx, SwapTxParams } from '../types'

/**
 * Fees for swap txs into a pool
 */
const txInFee$ = ({ asset, poolAddress, memo, amount }: SwapTxParams): FeeLD => {
  switch (asset.chain) {
    case BNBChain:
      return FP.pipe(
        BNB.fees$(),
        liveData.map((fees) => fees[FeeOptionKeys.SWAP])
      )

    case THORChain:
      return FP.pipe(
        THOR.fees$(),
        liveData.map((fees) => fees[FeeOptionKeys.SWAP])
      )

    case BTCChain:
      return FP.pipe(
        BTC.feesWithRates$(memo),
        liveData.map((btcFees) => btcFees.fees[FeeOptionKeys.SWAP])
      )

    case ETHChain: {
      return FP.pipe(
        poolAddress.router,
        O.fold(
          () => Rx.of(RD.failure(Error('ETH router address is missing'))),
          (router) => {
            const routerAddress = router.toLowerCase()
            return ETH.poolInTxFees$({
              address: router,
              abi: ethRouterABI,
              func: 'deposit',
              params: isEthAsset(asset)
                ? [
                    routerAddress,
                    ETHAddress,
                    0,
                    memo,
                    {
                      // Send `BaseAmount` w/o decimal and always round down for currencies
                      value: amount.amount().toFixed(0, BigNumber.ROUND_DOWN)
                    }
                  ]
                : [
                    routerAddress,
                    FP.pipe(getEthTokenAddress(asset), O.toUndefined),
                    // Send `BaseAmount` w/o decimal and always round down for currencies
                    amount.amount().toFixed(0, BigNumber.ROUND_DOWN),
                    memo
                  ]
            })
          }
        ),
        // Actual gas fee changes time to time so in many cases, actual fast gas fee is bigger than estimated fast fee
        // To avoid low gas fee error, we apply fastest fee for ETH only
        liveData.map((fees) => fees['fastest'])
      )
    }
    case CosmosChain:
      return Rx.of(RD.failure(Error('Cosmos fees is not implemented yet')))

    case PolkadotChain:
      return Rx.of(RD.failure(Error('Polkadot fees is not implemented yet')))

    case BCHChain:
      return FP.pipe(
        BCH.feesWithRates$(memo),
        liveData.map(({ fees }) => fees[FeeOptionKeys.SWAP])
      )

    case LTCChain:
      return FP.pipe(
        LTC.feesWithRates$(memo),
        liveData.map(({ fees }) => fees[FeeOptionKeys.SWAP])
      )
  }
}

/**
 * Fees for swap txs outgoing from a pool
 */
const txOutFee$ = ({ asset, memo }: SwapOutTx): FeeLD => {
  switch (asset.chain) {
    case BNBChain:
      return FP.pipe(
        BNB.fees$(),
        liveData.map((fees) => fees[FeeOptionKeys.SWAP])
      )

    case THORChain:
      return FP.pipe(
        THOR.fees$(),
        liveData.map((fees) => fees[FeeOptionKeys.SWAP])
      )

    case BTCChain:
      return FP.pipe(
        BTC.feesWithRates$(memo),
        liveData.map((btcFees) => btcFees.fees[FeeOptionKeys.SWAP])
      )

    case ETHChain: {
      return FP.pipe(
        ETH.poolOutTxFee$(asset),
        liveData.map((fees) => fees[FeeOptionKeys.SWAP])
      )
    }
    case CosmosChain:
      return Rx.of(RD.failure(Error('Cosmos fees is not implemented yet')))

    case PolkadotChain:
      return Rx.of(RD.failure(Error('Polkadot fees is not implemented yet')))

    case BCHChain:
      return FP.pipe(
        BCH.feesWithRates$(memo),
        liveData.map(({ fees }) => fees[FeeOptionKeys.SWAP])
      )

    case LTCChain:
      return FP.pipe(
        LTC.feesWithRates$(memo),
        liveData.map(({ fees }) => fees[FeeOptionKeys.SWAP])
      )
  }
}

// state for reloading swap fees
const { get$: reloadSwapFees$, set: reloadSwapFees } = observableState<O.Option<SwapFeesParams>>(O.none)

const swapFees$: SwapFeesHandler = (oInitialParams) => {
  return reloadSwapFees$.pipe(
    RxOp.debounceTime(300),
    RxOp.switchMap((oReloadParams) => {
      return FP.pipe(
        // (1) Always check reload params first
        oReloadParams,
        // (2) If reload params not set (which is by default), use initial params
        O.alt(() => oInitialParams),
        O.fold(
          // If both (initial + reload params) are not set, return zero fees
          () => Rx.of(RD.success(ZERO_SWAP_FEES)),
          ({ inTx, outTx }) => {
            // in case of zero amount, return zero fees (no API request needed)
            if (inTx.amount.amount().isZero()) return Rx.of(RD.success(ZERO_SWAP_FEES))

            // fee for pool IN tx
            const in$ = txInFee$(inTx).pipe(RxOp.shareReplay(1))
            // fee for pool OUT tx
            const out$ = Rx.iif(
              // In case chains of source and target are the same, but no ETH
              // then we don't need to do another request
              // and can use same fee provided by `in$` stream to fees for OUT tx
              () => eqChain.equals(inTx.asset.chain, outTx.asset.chain) && !isEthChain(inTx.poolAddress.chain),
              in$,
              txOutFee$(outTx)
            ) // Result needs to be 3 times as "normal" fee
              .pipe(liveData.map((fee) => baseAmount(fee.amount().times(3), fee.decimal)))

            return liveData.sequenceS({
              inTx: in$,
              outTx: out$
            })
          }
        )
      )
    })
  )
}

export { reloadSwapFees, swapFees$ }
