import React, { useMemo, useCallback, useState, useEffect } from 'react'

import * as RD from '@devexperts/remote-data-ts'
import { getSwitchMemo } from '@thorchain/asgardex-util'
import { Address } from '@xchainjs/xchain-client'
import {
  Asset,
  assetAmount,
  AssetBNB,
  assetToBase,
  BaseAmount,
  baseToAsset,
  BNBChain,
  formatAssetAmountCurrency
} from '@xchainjs/xchain-util'
import { Form } from 'antd'
import BigNumber from 'bignumber.js'
import * as FP from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import { useIntl } from 'react-intl'

import { Network } from '../../../../../shared/api/types'
import { ZERO_BASE_AMOUNT, ZERO_BN } from '../../../../const'
import { getChainAsset } from '../../../../helpers/chainHelper'
import { sequenceTOption } from '../../../../helpers/fpHelpers'
import { emptyString } from '../../../../helpers/stringHelper'
import { getBnbAmountFromBalances, getRuneBnBAmountFromBalances } from '../../../../helpers/walletHelper'
import { useSubscriptionState } from '../../../../hooks/useSubscriptionState'
import { INITIAL_UPGRADE_RUNE_STATE } from '../../../../services/chain/const'
import { UpgradeRuneParams, UpgradeRuneTxState, UpgradeRuneTxState$ } from '../../../../services/chain/types'
import { FeeRD } from '../../../../services/chain/types'
import { PoolAddressRD } from '../../../../services/midgard/types'
import { NonEmptyWalletBalances, ValidatePasswordHandler } from '../../../../services/wallet/types'
import { PasswordModal } from '../../../modal/password'
import { MaxBalanceButton } from '../../../uielements/button/MaxBalanceButton'
import { ViewTxButton } from '../../../uielements/button/ViewTxButton'
import { UIFeesRD } from '../../../uielements/fees'
import { InputBigNumber } from '../../../uielements/input/InputBigNumber'
import { AccountSelector } from '../../account'
import * as Styled from '../TxForm.style'
import { validateTxAmountInput } from '../TxForm.util'
import * as CStyled from './Upgrade.styles'

export type Props = {
  runeAsset: Asset
  runeNativeAddress: Address
  bnbPoolAddressRD: PoolAddressRD
  validatePassword$: ValidatePasswordHandler
  fee: FeeRD
  upgrade$: (_: UpgradeRuneParams) => UpgradeRuneTxState$
  balances: O.Option<NonEmptyWalletBalances>
  reloadFeeHandler: FP.Lazy<void>
  successActionHandler: (txHash: string) => Promise<void>
  reloadBalancesHandler: FP.Lazy<void>
  network: Network
}

type FormValues = {
  amount: BigNumber
}

const INITIAL_FORM_VALUES: FormValues = { amount: ZERO_BN }

export const Upgrade: React.FC<Props> = (props): JSX.Element => {
  const {
    runeAsset,
    runeNativeAddress,
    bnbPoolAddressRD,
    validatePassword$,
    fee: feeRD,
    upgrade$,
    balances: oBalances,
    successActionHandler,
    reloadFeeHandler,
    reloadBalancesHandler,
    network
  } = props

  const intl = useIntl()

  const [form] = Form.useForm<FormValues>()

  const [amountToUpgrade, setAmountToUpgrade] = useState<BaseAmount>(ZERO_BASE_AMOUNT)

  // State for visibility of Modal to confirm upgrade
  const [showConfirmUpgradeModal, setShowConfirmUpgradeModal] = useState(false)

  const {
    state: upgradeTxState,
    reset: resetUpgradeTxState,
    subscribe: subscribeUpgradeTxState
  } = useSubscriptionState<UpgradeRuneTxState>(INITIAL_UPGRADE_RUNE_STATE)

  const onFinishHandler = useCallback(() => {
    reloadBalancesHandler()
    resetUpgradeTxState()
    setAmountToUpgrade(ZERO_BASE_AMOUNT)
  }, [reloadBalancesHandler, resetUpgradeTxState])

  const onErrorHandler = useCallback(() => {
    resetUpgradeTxState()
    setAmountToUpgrade(ZERO_BASE_AMOUNT)
  }, [resetUpgradeTxState])

  const oRuneBnbAmount: O.Option<BaseAmount> = useMemo(
    () => FP.pipe(oBalances, O.chain(FP.flow(getRuneBnBAmountFromBalances, O.map(assetToBase)))),
    [oBalances]
  )

  const oBnbAmount: O.Option<BaseAmount> = useMemo(
    () => FP.pipe(oBalances, O.chain(FP.flow(getBnbAmountFromBalances, O.map(assetToBase)))),
    [oBalances]
  )

  const maxAmount: BaseAmount = useMemo(
    () =>
      FP.pipe(
        oRuneBnbAmount,
        O.getOrElse(() => ZERO_BASE_AMOUNT)
      ),
    [oRuneBnbAmount]
  )

  useEffect(() => {
    // Whenever `amountToUpgrade` has been updated, we put it back into input field
    form.setFieldsValue({
      amount: baseToAsset(amountToUpgrade).amount()
    })
  }, [amountToUpgrade, form])

  const amountValidator = useCallback(
    async (_: unknown, value: BigNumber) => {
      return validateTxAmountInput({
        input: value,
        maxAmount: baseToAsset(maxAmount),
        errors: {
          msg1: intl.formatMessage({ id: 'wallet.errors.amount.shouldBeNumber' }),
          msg2: intl.formatMessage({ id: 'wallet.errors.amount.shouldBeGreaterThan' }, { amount: '0' }),
          msg3: intl.formatMessage({ id: 'wallet.errors.amount.shouldBeLessThanBalance' })
        }
      })
    },
    [intl, maxAmount]
  )

  const onChangeInput = useCallback(
    async (value: BigNumber) => {
      // we have to validate input before storing into the state
      amountValidator(undefined, value)
        .then(() => {
          setAmountToUpgrade(assetToBase(assetAmount(value)))
        })
        .catch(() => {}) // do nothing, Ant' form does the job for us to show an error message
    },
    [amountValidator]
  )

  const onSubmit = useCallback(() => setShowConfirmUpgradeModal(true), [])

  const upgrade = useCallback(
    () =>
      FP.pipe(
        bnbPoolAddressRD,
        RD.toOption,
        O.map((poolAddresses) => {
          subscribeUpgradeTxState(
            upgrade$({
              poolAddresses,
              amount: amountToUpgrade,
              asset: runeAsset,
              memo: getSwitchMemo(runeNativeAddress)
            })
          )
          return true
        })
      ),

    [runeNativeAddress, bnbPoolAddressRD, upgrade$, amountToUpgrade, runeAsset, subscribeUpgradeTxState]
  )

  const oFee: O.Option<BaseAmount> = useMemo(() => FP.pipe(feeRD, RD.toOption), [feeRD])

  const isFeeError = useMemo(() => {
    return FP.pipe(
      sequenceTOption(oFee, oBnbAmount),
      O.fold(
        // Missing (or loading) fees does not mean we can't sent something. No error then.
        () => !O.isNone(oFee),
        ([fee, bnbAmount]) => bnbAmount.amount().isLessThan(fee.amount())
      )
    )
  }, [oBnbAmount, oFee])

  const renderFeeError = useMemo(() => {
    if (!isFeeError) return <></>

    return FP.pipe(
      sequenceTOption(oFee, oBnbAmount),
      O.map(([fee, bnbAmount]) => {
        const msg = intl.formatMessage(
          { id: 'wallet.upgrade.feeError' },
          {
            fee: formatAssetAmountCurrency({
              amount: baseToAsset(fee),
              asset: AssetBNB,
              trimZeros: true
            }),
            balance: formatAssetAmountCurrency({
              amount: baseToAsset(bnbAmount),
              asset: AssetBNB,
              trimZeros: true
            })
          }
        )
        // `key`  has to be set to avoid "Missing "key" prop for element in iterator"
        return (
          <Styled.Label key="upgrade-fee-error" size="big" color="error">
            {msg}
          </Styled.Label>
        )
      }),
      O.getOrElse(() => <></>)
    )
  }, [isFeeError, oFee, oBnbAmount, intl])

  const uiFeesRD: UIFeesRD = useMemo(
    () =>
      FP.pipe(
        feeRD,
        RD.map((fee) => [{ asset: getChainAsset(runeAsset.chain), amount: fee }])
      ),

    [feeRD, runeAsset.chain]
  )

  const txStatusMsg = useMemo(() => {
    const stepDescriptions = [
      intl.formatMessage({ id: 'common.tx.healthCheck' }),
      intl.formatMessage({ id: 'common.tx.sendingAsset' }, { assetTicker: runeAsset.ticker }),
      intl.formatMessage({ id: 'common.tx.checkResult' })
    ]
    const { steps, status } = upgradeTxState

    return FP.pipe(
      status,
      RD.fold(
        () => emptyString,
        () =>
          `${stepDescriptions[steps.current - 1]} (${intl.formatMessage(
            { id: 'common.step' },
            { current: steps.current, total: steps.total }
          )})`,
        () => emptyString,
        () => emptyString
      )
    )
  }, [intl, runeAsset.ticker, upgradeTxState])

  const renderErrorBtn = useMemo(
    () => <Styled.Button onClick={onErrorHandler}>{intl.formatMessage({ id: 'common.back' })}</Styled.Button>,
    [intl, onErrorHandler]
  )

  const renderSuccessExtra = useCallback(
    (txHash: string) => {
      const onClickHandler = () => successActionHandler(txHash)
      return (
        <Styled.SuccessExtraContainer>
          <Styled.SuccessExtraButton onClick={onFinishHandler}>
            {intl.formatMessage({ id: 'common.back' })}
          </Styled.SuccessExtraButton>
          <ViewTxButton txHash={O.some(txHash)} onClick={onClickHandler} />
        </Styled.SuccessExtraContainer>
      )
    },
    [intl, onFinishHandler, successActionHandler]
  )

  const addMaxAmountHandler = useCallback(() => setAmountToUpgrade(maxAmount), [maxAmount])

  const isLoading = useMemo(() => RD.isPending(upgradeTxState.status), [upgradeTxState.status])

  const isDisabled: boolean = useMemo(
    () =>
      isFeeError ||
      FP.pipe(
        oRuneBnbAmount,
        O.map((amount) => amount.amount().isLessThanOrEqualTo(0) || isLoading),
        O.getOrElse<boolean>(() => true)
      ),
    [isFeeError, oRuneBnbAmount, isLoading]
  )

  const renderUpgradeForm = useMemo(
    () => (
      <CStyled.FormWrapper>
        <CStyled.FormContainer>
          <AccountSelector selectedAsset={runeAsset} walletBalances={[]} network={network} />
          <Styled.Form form={form} initialValues={INITIAL_FORM_VALUES} onFinish={onSubmit} labelCol={{ span: 24 }}>
            <Styled.SubForm>
              <Styled.CustomLabel size="big">{intl.formatMessage({ id: 'common.amount' })}</Styled.CustomLabel>
              <Styled.FormItem
                rules={[
                  {
                    required: true,
                    validator: amountValidator
                  }
                ]}
                name="amount"
                validateTrigger={['onSubmit', 'onChange', 'onBlur']}>
                <InputBigNumber size="large" disabled={isLoading} decimal={8} onChange={onChangeInput} />
              </Styled.FormItem>
              <MaxBalanceButton
                balance={{ amount: maxAmount, asset: runeAsset }}
                onClick={addMaxAmountHandler}
                disabled={isLoading}
              />

              <CStyled.Fees fees={uiFeesRD} reloadFees={reloadFeeHandler} disabled={isLoading} />
              {renderFeeError}
            </Styled.SubForm>
            <Styled.SubmitContainer>
              <Styled.SubmitStatus>{txStatusMsg}</Styled.SubmitStatus>
              <Styled.Button loading={isLoading} htmlType="submit" disabled={isDisabled}>
                {intl.formatMessage({ id: 'wallet.action.upgrade' })}
              </Styled.Button>
            </Styled.SubmitContainer>
          </Styled.Form>
        </CStyled.FormContainer>
      </CStyled.FormWrapper>
    ),
    [
      addMaxAmountHandler,
      amountValidator,
      form,
      intl,
      isDisabled,
      isLoading,
      maxAmount,
      onChangeInput,
      onSubmit,
      reloadFeeHandler,
      renderFeeError,
      runeAsset,
      txStatusMsg,
      uiFeesRD,
      network
    ]
  )

  const upgradeConfirmationHandler = useCallback(() => {
    // close confirmation modal
    setShowConfirmUpgradeModal(false)
    upgrade()
  }, [upgrade])

  const renderConfirmUpgradeModal = useMemo(
    () =>
      showConfirmUpgradeModal ? (
        <PasswordModal
          onSuccess={upgradeConfirmationHandler}
          onClose={() => setShowConfirmUpgradeModal(false)}
          validatePassword$={validatePassword$}
        />
      ) : (
        <></>
      ),
    [showConfirmUpgradeModal, upgradeConfirmationHandler, validatePassword$]
  )

  const renderUpgradeStatus = useMemo(
    () =>
      FP.pipe(
        upgradeTxState.status,
        RD.fold(
          () => renderUpgradeForm,
          () => renderUpgradeForm,
          (error) => (
            <CStyled.ErrorView
              title={intl.formatMessage({ id: 'wallet.upgrade.error' })}
              subTitle={error.msg}
              extra={renderErrorBtn}
            />
          ),
          (hash) => (
            <CStyled.SuccessView
              title={intl.formatMessage({ id: 'wallet.upgrade.success' })}
              extra={renderSuccessExtra(hash)}
            />
          )
        )
      ),
    [intl, renderErrorBtn, renderSuccessExtra, renderUpgradeForm, upgradeTxState]
  )

  return (
    <>
      {renderConfirmUpgradeModal}
      {FP.pipe(
        bnbPoolAddressRD,
        RD.fold(
          () => renderUpgradeStatus,
          () => renderUpgradeStatus,
          () => (
            <CStyled.ErrorView
              title={intl.formatMessage({ id: 'wallet.upgrade.error.loadPoolAddress' }, { pool: BNBChain })}
              extra={renderErrorBtn}
            />
          ),
          (_) => renderUpgradeStatus
        )
      )}
    </>
  )
}
