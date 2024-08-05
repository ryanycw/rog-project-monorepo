import { COMMON_POOL, POOL_INFO, POOLS, VRF } from "../constants";
import { BlindBoxType, Pool, PoolInfo } from "../types";
import SoulboundService from "./SoulboundService";
import AvatarService from "./AvatarService";
import { client } from "../database/DynamoDB";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default class PoolService {
    private seed: bigint;
    private pools: Pool[];
    private poolInfo: PoolInfo;
    private avatarService: AvatarService;
    private soulboundService: SoulboundService;
    private client: DocumentClient;

    constructor(
        avatarService: AvatarService,
        soulboundService: SoulboundService,
    ) {
        this.seed = VRF;
        this.pools = POOLS;
        this.poolInfo = POOL_INFO;
        this.avatarService = avatarService;
        this.soulboundService = soulboundService;
        this.client = client;
    }

    // check if the pool is all revealed
    private async isPoolFull(pool: Pool): Promise<boolean> {
        const startIdx = Number(pool.startIdx);
        const size = Number(pool.size);

        const params = {
            TableName: this.avatarService.getTableName(),
            FilterExpression:
                "#tokenId >= :start and #tokenId < :end and #isRevealed = :isRevealed",
            ExpressionAttributeNames: {
                "#tokenId": "tokenId",
                "#isRevealed": "isRevealed",
            }, // optional names substitution
            ExpressionAttributeValues: {
                ":start": startIdx,
                ":end": startIdx + size,
                ":isRevealed": true,
            },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count ?? 0;

        return count >= size;
    }

    // get pool by randomId
    // 1. pick up the pool
    // 2. if pool is full, pick up a pool is not full yet
    private async getPoolByRandomId(randomId: number): Promise<Pool> {
        let pool = this.pools.find((pool) => {
            const startIdx = Number(pool.originalStartIdx);
            const lastIdx = Number(pool.originalStartIdx + pool.originalSize - 1n);
            return randomId >= startIdx && randomId <= lastIdx;
        });

        if (pool == undefined) {
            pool = COMMON_POOL;
        }

        let isPoolFull = await this.isPoolFull(pool);
        for (let i = 0; i < this.pools.length; i++) {
            isPoolFull = await this.isPoolFull(this.pools[i]);
            if (!isPoolFull) {
                pool = this.pools[i];
                break;
            }
        }

        return pool;
    }

    // reveal the avatar tokenId will bind with
    // the given revealedId
    async revealNft(avatarId: number): Promise<number> {
        // check the contract the stage is on reveal or not
        const enableReveal = this.avatarService.enableReveal();
        if (!enableReveal) {
            throw new Error("The reveal stage is not available");
        }

        // check the avatar is revealed or not
        const avatar = await this.avatarService.getAvatarById(avatarId);
        if (avatar.isRevealed) {
            throw new Error("This nft is revealed");
        }

        const soulboundId =
            await this.avatarService.getSoulboundIdById(avatarId);
        const type =
            await this.soulboundService.getBlindBoxTypeById(soulboundId);

        // common do calculate random id
        if (type == BlindBoxType.COMMON) {
            // get the revealedId
            // seed is u256, need to convert bigint to do the operation
            // using number to do it will occur overflow error
            let offset = (this.seed + BigInt(avatarId)) % this.poolInfo.size;
            let randomId = Number(this.poolInfo.startIdx + offset);
            const pool = await this.getPoolByRandomId(randomId);
            // make sure the randomId is within the pool
            randomId = Number(pool.startIdx + offset);
            let isRandomIdRevealed =
                await this.avatarService.isRandomIdRevealed(randomId);

            // find the revealedId which is not revealed yet
            while (isRandomIdRevealed) {
                offset = (offset + 1n) % pool.size;
                randomId = Number(pool.startIdx + offset);
                isRandomIdRevealed =
                    await this.avatarService.isRandomIdRevealed(randomId);
            }

            avatar.randomId = randomId;
        }

        avatar.isRevealed = true;
        await this.avatarService.updateAvatar(avatar);

        return avatar.randomId;
    }
}
