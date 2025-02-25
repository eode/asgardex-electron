// tslint:disable
/**
 * Midgard Public API
 * The Midgard Public API queries THORChain and any chains linked via the Bifröst and prepares information about the network to be readily available for public users. The API parses transaction event data from THORChain and stores them in a time-series database to make time-dependent queries easy. Midgard does not hold critical information. To interact with BEPSwap and Asgardex, users should query THORChain directly.
 *
 * The version of the OpenAPI document: 2.0.0-alpha.3
 * Contact: devs@thorchain.org
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import {
    Coin,
} from './';

/**
 * @export
 * @interface SwapMetadata
 */
export interface SwapMetadata {
    /**
     * Int64(e8), RUNE amount charged as swap liquidity fee
     * @type {string}
     * @memberof SwapMetadata
     */
    liquidityFee: string;
    /**
     * List of network fees associated to an action. One network fee is charged for each outbound transaction
     * @type {Array<Coin>}
     * @memberof SwapMetadata
     */
    networkFees: Array<Coin>;
    /**
     * Int64 (Basis points, 0-10000, where 10000=100%), swap slip percentage
     * @type {string}
     * @memberof SwapMetadata
     */
    swapSlip: string;
    /**
     * Int64(e8), minimum output amount specified for the swap
     * @type {string}
     * @memberof SwapMetadata
     */
    swapTarget: string;
}
