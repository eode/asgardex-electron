import React, { useCallback, useMemo, useRef, useState } from 'react'

import * as RD from '@devexperts/remote-data-ts'
import { PoolData } from '@thorchain/asgardex-util'
import {
  Asset,
  AssetAmount,
  baseAmount,
  BaseAmount,
  baseToAsset,
  formatAssetAmountCurrency
} from '@xchainjs/xchain-util'
import { Col } from 'antd'
import BigNumber from 'bignumber.js'
import * as FP from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import { useObservableState } from 'observable-hooks'
import { useIntl } from 'react-intl'
import * as Rx from 'rxjs'
import * as RxOp from 'rxjs/operators'

import { Network } from '../../../../shared/api/types'
import { ZERO_BASE_AMOUNT, ZERO_BN } from '../../../const'
import { isChainAsset } from '../../../helpers/assetHelper'
import { sequenceSOption, sequenceTOption } from '../../../helpers/fpHelpers'
import { useSubscriptionState } from '../../../hooks/useSubscriptionState'
import { INITIAL_ASYM_DEPOSIT_STATE } from '../../../services/chain/const'
import {
  Memo,
  AsymDepositState,
  AsymDepositStateHandler,
  DepositFeesRD,
  DepositFeesLD,
  AsymDepositParams
} from '../../../services/chain/types'
import { PoolAddress } from '../../../services/midgard/types'
import { ValidatePasswordHandler } from '../../../services/wallet/types'
import { WalletBalances } from '../../../types/wallet'
import { PasswordModal } from '../../modal/password'
import { TxModal } from '../../modal/tx'
import { DepositAssets } from '../../modal/tx/extra'
import { ViewTxButton } from '../../uielements/button'
import { Fees, UIFeesRD } from '../../uielements/fees'
import { formatFee } from '../../uielements/fees/Fees.helper'
import * as Helper from './Deposit.helper'
import * as Styled from './Deposit.style'

export type Props = {
  asset: Asset
  assetPrice: BigNumber
  assetBalance: O.Option<BaseAmount>
  chainAssetBalance: O.Option<BaseAmount>
  poolAddress: O.Option<PoolAddress>
  memo: O.Option<Memo>
  priceAsset?: Asset
  reloadFees: (p: AsymDepositParams) => void
  fees$: (p: AsymDepositParams) => DepositFeesLD
  reloadBalances: FP.Lazy<void>
  viewAssetTx: (txHash: string) => void
  validatePassword$: ValidatePasswordHandler
  balances: WalletBalances
  onChangeAsset: (asset: Asset) => void
  disabled?: boolean
  poolData: PoolData
  deposit$: AsymDepositStateHandler
  network: Network
}

/**
 * AsymDeposit component
 *
 * Note: This component is still under developlment - it won't work !!!
 */
export const AsymDeposit: React.FC<Props> = (props) => {
  const {
    asset,
    assetPrice,
    assetBalance: oAssetBalance,
    chainAssetBalance: oChainAssetBalance,
    memo: oMemo,
    poolAddress: oPoolAddress,
    viewAssetTx = (_) => {},
    validatePassword$,
    balances,
    priceAsset,
    reloadFees,
    reloadBalances = FP.constVoid,
    fees$,
    onChangeAsset,
    disabled = false,
    deposit$,
    network
  } = props

  const intl = useIntl()
  const [assetAmountToDeposit, setAssetAmountToDeposit] = useState<BaseAmount>(ZERO_BASE_AMOUNT)
  const [percentValueToDeposit, setPercentValueToDeposit] = useState(0)

  const {
    state: depositState,
    reset: resetDepositState,
    subscribe: subscribeDepositState
  } = useSubscriptionState<AsymDepositState>(INITIAL_ASYM_DEPOSIT_STATE)

  // Deposit start time
  const [depositStartTime, setDepositStartTime] = useState<number>(0)

  const assetBalance: BaseAmount = useMemo(
    () =>
      FP.pipe(
        oAssetBalance,
        O.getOrElse(() => ZERO_BASE_AMOUNT)
      ),
    [oAssetBalance]
  )

  // TODO: Implement it
  const oDepositParams: O.Option<AsymDepositParams> = useMemo(() => O.none, [])

  const chainFees$ = useMemo(() => fees$, [fees$])

  const prevDepositFeesRD = useRef<DepositFeesRD>(RD.initial)
  const [depositFeesRD] = useObservableState<DepositFeesRD>(
    () =>
      FP.pipe(
        oDepositParams,
        O.map(chainFees$),
        O.getOrElse<DepositFeesLD>(() => Rx.of(RD.initial)),
        RxOp.tap((feesRD) => {
          if (RD.isSuccess(feesRD)) {
            prevDepositFeesRD.current = feesRD
          }
        })
      ),
    RD.initial
  )
  const oAssetChainFee: O.Option<BaseAmount> = useMemo(
    () =>
      FP.pipe(
        depositFeesRD,
        Helper.getAssetChainFee,
        // Set previously loaded fees to have that values when fees are reloading
        // in other case changing amount while reloading fees will set max amount to zero value
        O.alt(() => Helper.getAssetChainFee(prevDepositFeesRD.current))
      ),
    [depositFeesRD]
  )

  const maxAssetAmountToDeposit: BaseAmount = useMemo(() => {
    // substract fees if needed
    if (isChainAsset(asset)) {
      return FP.pipe(
        sequenceTOption(oAssetChainFee, oAssetBalance),
        // Check: maxAmount > fee
        O.filter(([fee]) => assetBalance.amount().isGreaterThan(fee.amount())),
        // Substract fee from balance
        O.map(([fee, balance]) => balance.amount().minus(fee.amount())),
        // Set maxAmount to zero as long as we dont have a feeRate
        O.getOrElse(() => ZERO_BN),
        baseAmount
      )
    }
    // or return asset balances w/o any restriction
    return assetBalance
  }, [asset, assetBalance, oAssetBalance, oAssetChainFee])

  const hasAssetBalance = useMemo(() => assetBalance.amount().isGreaterThan(0), [assetBalance])

  const isBalanceError = useMemo(() => !hasAssetBalance, [hasAssetBalance])

  const showBalanceError = useMemo(
    () =>
      // Note:
      // To avoid flickering of balance error for a short time at the beginning
      // We never show error if balances are not available
      FP.pipe(oAssetBalance, (balances) => O.isSome(balances) && isBalanceError),
    [isBalanceError, oAssetBalance]
  )

  const renderBalanceError = useMemo(() => {
    const msg = intl.formatMessage(
      { id: 'deposit.add.error.nobalance1' },
      {
        asset: asset.ticker
      }
    )

    const title = intl.formatMessage({ id: 'deposit.add.error.nobalances' })

    return <Styled.BalanceAlert type="warning" message={title} description={msg} />
  }, [asset.ticker, intl])

  const assetAmountChangeHandler = useCallback(
    (assetInput: BaseAmount) => {
      // We don't accept more that `maxAssetAmountToDeposit`
      const value = assetInput.amount().isGreaterThan(maxAssetAmountToDeposit.amount())
        ? { ...maxAssetAmountToDeposit } // Use copy to avoid missmatch with values in input fields
        : assetInput
      setAssetAmountToDeposit(value)
      // assetQuantity * 100 / maxAssetAmountToDeposit
      const percentToDeposit = maxAssetAmountToDeposit.amount().isGreaterThan(0)
        ? value.amount().multipliedBy(100).dividedBy(maxAssetAmountToDeposit.amount()).toNumber()
        : 0
      setPercentValueToDeposit(percentToDeposit)
    },
    [maxAssetAmountToDeposit]
  )

  const changePercentHandler = useCallback(
    (percent: number) => {
      const assetAmountBN = maxAssetAmountToDeposit.amount().dividedBy(100).multipliedBy(percent)
      setAssetAmountToDeposit(baseAmount(assetAmountBN))
      setPercentValueToDeposit(percent)
    },
    [maxAssetAmountToDeposit]
  )

  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const confirmDepositHandler = useCallback(() => {
    setShowPasswordModal(true)
  }, [setShowPasswordModal])

  const renderFeeError = useCallback(
    (fee: BaseAmount, balance: AssetAmount, asset: Asset) => {
      const msg = intl.formatMessage(
        { id: 'deposit.add.error.chainFeeNotCovered' },
        {
          fee: formatFee({ amount: fee, asset }),
          balance: formatAssetAmountCurrency({ amount: balance, asset, trimZeros: true })
        }
      )

      return <Styled.FeeErrorLabel>{msg}</Styled.FeeErrorLabel>
    },
    [intl]
  )

  const isAssetChainFeeError = useMemo(() => {
    return FP.pipe(
      sequenceTOption(oAssetChainFee, oChainAssetBalance),
      O.fold(
        // Missing (or loading) fees does not mean we can't sent something. No error then.
        () => !O.isNone(oAssetChainFee),
        ([fee, balance]) => balance.amount().isLessThan(fee.amount())
      )
    )
  }, [oAssetChainFee, oChainAssetBalance])

  const renderAssetChainFeeError = useMemo(() => {
    const amount = FP.pipe(
      oChainAssetBalance,
      O.getOrElse(() => ZERO_BASE_AMOUNT),
      baseToAsset
    )

    return FP.pipe(
      oAssetChainFee,
      O.map((fee) => renderFeeError(fee, amount, asset)),
      O.getOrElse(() => <></>)
    )
  }, [oChainAssetBalance, oAssetChainFee, renderFeeError, asset])

  const txModalExtraContent = useMemo(() => {
    const stepDescriptions = [
      intl.formatMessage({ id: 'common.tx.healthCheck' }),
      intl.formatMessage({ id: 'common.tx.sendingAsset' }, { assetTicker: asset.ticker }),
      intl.formatMessage({ id: 'common.tx.checkResult' })
    ]
    const stepDescription = FP.pipe(
      depositState.deposit,
      RD.fold(
        () => '',
        () =>
          `${intl.formatMessage(
            { id: 'common.step' },
            { current: depositState.step, total: depositState.stepsTotal }
          )}: ${stepDescriptions[depositState.step - 1]}`,
        () => '',
        () => `${intl.formatMessage({ id: 'common.done' })}!`
      )
    )

    return (
      <DepositAssets
        target={{ asset, amount: assetAmountToDeposit }}
        source={O.none}
        stepDescription={stepDescription}
        network={network}
      />
    )
  }, [intl, asset, depositState, assetAmountToDeposit, network])

  const onCloseTxModal = useCallback(() => {
    resetDepositState()
    setPercentValueToDeposit(0)
  }, [resetDepositState, setPercentValueToDeposit])

  const onFinishTxModal = useCallback(() => {
    onCloseTxModal()
    reloadBalances()
  }, [onCloseTxModal, reloadBalances])

  const renderTxModal = useMemo(() => {
    const { deposit: depositRD, depositTx: asymDepositTx } = depositState

    // don't render TxModal in initial state
    if (RD.isInitial(depositRD)) return <></>

    // Get timer value
    const timerValue = FP.pipe(
      depositRD,
      RD.fold(
        () => 0,
        FP.flow(
          O.map(({ loaded }) => loaded),
          O.getOrElse(() => 0)
        ),
        () => 0,
        () => 100
      )
    )

    // title
    const txModalTitle = FP.pipe(
      depositRD,
      RD.fold(
        () => 'deposit.add.state.pending',
        () => 'deposit.add.state.pending',
        () => 'deposit.add.state.error',
        () => 'deposit.add.state.success'
      ),
      (id) => intl.formatMessage({ id })
    )

    const extraResult = <ViewTxButton txHash={RD.toOption(asymDepositTx)} onClick={viewAssetTx} />

    return (
      <TxModal
        title={txModalTitle}
        onClose={onCloseTxModal}
        onFinish={onFinishTxModal}
        startTime={depositStartTime}
        txRD={depositRD}
        timerValue={timerValue}
        extraResult={extraResult}
        extra={txModalExtraContent}
      />
    )
  }, [depositState, viewAssetTx, onCloseTxModal, onFinishTxModal, depositStartTime, txModalExtraContent, intl])

  const onClosePasswordModal = useCallback(() => {
    // close password modal
    setShowPasswordModal(false)
  }, [])

  const onSucceedPasswordModal = useCallback(() => {
    // close private modal
    setShowPasswordModal(false)

    FP.pipe(
      sequenceSOption({ memo: oMemo, poolAddress: oPoolAddress }),
      O.map(({ memo, poolAddress }) => {
        // set start time
        setDepositStartTime(Date.now())

        subscribeDepositState(
          deposit$({
            asset,
            poolAddress,
            amount: assetAmountToDeposit,
            memo
          })
        )

        return true
      })
    )
  }, [oMemo, subscribeDepositState, deposit$, asset, oPoolAddress, assetAmountToDeposit])

  const uiFeesRD: UIFeesRD = useMemo(
    () =>
      FP.pipe(
        depositFeesRD,
        RD.map(({ asset: assetFeeAmount }) => [{ asset, amount: assetFeeAmount }])
      ),
    [asset, depositFeesRD]
  )

  const disabledForm = useMemo(() => isBalanceError || disabled, [disabled, isBalanceError])

  const reloadFeesHandler = useCallback(() => {
    FP.pipe(oDepositParams, O.map(reloadFees))
  }, [oDepositParams, reloadFees])

  return (
    <Styled.Container>
      <Styled.BalanceErrorRow>
        <Col xs={24}>{showBalanceError && renderBalanceError}</Col>
      </Styled.BalanceErrorRow>
      <Styled.CardsRow gutter={{ lg: 32 }}>
        <Col xs={24} xl={12}>
          <Styled.AssetCard
            disabled={disabledForm}
            asset={asset}
            selectedAmount={assetAmountToDeposit}
            maxAmount={maxAssetAmountToDeposit}
            onChangeAssetAmount={assetAmountChangeHandler}
            price={assetPrice}
            balances={balances}
            percentValue={percentValueToDeposit}
            onChangePercent={changePercentHandler}
            onChangeAsset={onChangeAsset}
            inputOnBlurHandler={reloadFeesHandler}
            priceAsset={priceAsset}
            network={network}
            onAfterSliderChange={reloadFeesHandler}
          />
        </Col>
        <Col xs={24} xl={12}></Col>
      </Styled.CardsRow>

      <Styled.FeesRow gutter={{ lg: 32 }}>
        <Col xs={24} xl={12}>
          <Styled.FeeRow>
            <Fees fees={uiFeesRD} reloadFees={reloadFeesHandler} />
          </Styled.FeeRow>
          <Styled.FeeErrorRow>
            <Col>
              <>
                {
                  // Don't show asset chain fee error if we already display a error of balances
                  !isBalanceError && isAssetChainFeeError && renderAssetChainFeeError
                }
              </>
            </Col>
          </Styled.FeeErrorRow>
        </Col>
      </Styled.FeesRow>

      <Styled.SubmitButtonWrapper>
        <Styled.SubmitButton onClick={confirmDepositHandler} disabled={disabledForm}>
          {intl.formatMessage({ id: 'common.add' })}
        </Styled.SubmitButton>
      </Styled.SubmitButtonWrapper>
      {showPasswordModal && (
        <PasswordModal
          onSuccess={onSucceedPasswordModal}
          onClose={onClosePasswordModal}
          validatePassword$={validatePassword$}
        />
      )}
      {renderTxModal}
    </Styled.Container>
  )
}
