import { assetFromString, assetToString } from '@xchainjs/xchain-util'
import * as FP from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'

import { isRuneBnbAsset } from '../../helpers/assetHelper'
import { sequenceTOption } from '../../helpers/fpHelpers'
import { Route } from '../types'

export * as imports from './imports'

export * as create from './create'

type RedirectUrl = string

export const base: Route<RedirectUrl | void> = {
  template: '/wallet',
  path(redirectUrl) {
    return redirectUrl ? `${this.template}?redirectUrl=${redirectUrl}` : this.template
  }
}

export const noWallet: Route<void> = {
  template: `${base.template}/noWallet`,
  path() {
    return this.template
  }
}

export const REDIRECT_PARAMETER_NAME = 'redirectUrl'

export const locked: Route<RedirectUrl | void> = {
  template: `${base.template}/locked`,
  path(redirectUrl) {
    return redirectUrl ? `${this.template}?${REDIRECT_PARAMETER_NAME}=${redirectUrl}` : this.template
  }
}

export const settings: Route<void> = {
  template: `${base.template}/settings`,
  path() {
    return this.template
  }
}

export const assets: Route<void> = {
  template: `${base.template}/assets`,
  path() {
    return this.template
  }
}

export const poolShares: Route<void> = {
  template: `${base.template}/poolshares`,
  path() {
    return this.template
  }
}

export type DepositParams = { walletAddress: string }
export const deposit: Route<DepositParams> = {
  template: `${base.template}/deposit/:walletAddress`,
  path({ walletAddress }) {
    return `${base.template}/deposit/${walletAddress}`
  }
}

export const bonds: Route<void> = {
  template: `${base.template}/bonds`,
  path() {
    return this.template
  }
}

export type AssetDetailsParams = { asset: string; walletAddress: string }
export const assetDetail: Route<AssetDetailsParams> = {
  template: `${assets.template}/detail/:walletAddress/:asset`,
  path: ({ asset, walletAddress }) => {
    if (asset && !!walletAddress) {
      return `${assets.template}/detail/${walletAddress}/${asset}`
    } else {
      // Redirect to assets route if passed param is empty
      return assets.path()
    }
  }
}

export type SendParams = { asset: string; walletAddress: string }
export const send: Route<SendParams> = {
  template: `${assetDetail.template}/send`,
  path: ({ asset, walletAddress }) => {
    if (asset && !!walletAddress) {
      return `${assetDetail.path({ asset, walletAddress })}/send`
    } else {
      // Redirect to assets route if passed params are empty
      return assets.path()
    }
  }
}

export const upgradeBnbRune: Route<AssetDetailsParams> = {
  template: `${assetDetail.template}/upgrade`,
  path: ({ asset: assetString, walletAddress }) => {
    // Validate asset string to accept BNB.Rune only
    const oAsset = FP.pipe(assetFromString(assetString), O.fromNullable, O.filter(isRuneBnbAsset))
    // Simple validation of address
    const oWalletAddress = FP.pipe(
      walletAddress,
      O.fromPredicate((s: string) => s.length > 0)
    )
    return FP.pipe(
      sequenceTOption(oAsset, oWalletAddress),
      O.fold(
        // Redirect to assets route if passed params are empty
        () => assets.path(),
        ([asset, walletAddress]) => `${assetDetail.path({ asset: assetToString(asset), walletAddress })}/upgrade`
      )
    )
  }
}

export const history: Route<void> = {
  template: `${base.template}/history`,
  path() {
    return this.template
  }
}
