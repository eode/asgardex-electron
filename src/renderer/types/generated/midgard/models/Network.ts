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
    BlockRewards,
    BondMetrics,
} from './';

/**
 * @export
 * @interface Network
 */
export interface Network {
    /**
     * @type {Array<string>}
     * @memberof Network
     */
    activeBonds: Array<string>;
    /**
     * Int64, Number of Active Nodes
     * @type {string}
     * @memberof Network
     */
    activeNodeCount: string;
    /**
     * @type {BlockRewards}
     * @memberof Network
     */
    blockRewards: BlockRewards;
    /**
     * @type {BondMetrics}
     * @memberof Network
     */
    bondMetrics: BondMetrics;
    /**
     * Float, (1 + (bondReward * blocksPerMonth/totalActiveBond)) ^ 12 -1
     * @type {string}
     * @memberof Network
     */
    bondingAPY: string;
    /**
     * Float, (1 + (stakeReward * blocksPerMonth/totalDepth of active pools)) ^ 12 -1
     * @type {string}
     * @memberof Network
     */
    liquidityAPY: string;
    /**
     * Int64, next height of blocks
     * @type {string}
     * @memberof Network
     */
    nextChurnHeight: string;
    /**
     * Int64, the remaining time of pool activation (in blocks)
     * @type {string}
     * @memberof Network
     */
    poolActivationCountdown: string;
    /**
     * @type {string}
     * @memberof Network
     */
    poolShareFactor: string;
    /**
     * Array of Standby Bonds
     * @type {Array<string>}
     * @memberof Network
     */
    standbyBonds: Array<string>;
    /**
     * Int64, Number of Standby Nodes
     * @type {string}
     * @memberof Network
     */
    standbyNodeCount: string;
    /**
     * Int64(e8), Total Rune pooled in all pools
     * @type {string}
     * @memberof Network
     */
    totalPooledRune: string;
    /**
     * Int64(e8), Total left in Reserve
     * @type {string}
     * @memberof Network
     */
    totalReserve: string;
}
