import { Avatar } from "../types";
import { Contract } from "ethers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { client } from "../database/DynamoDB";

export default class AvatarService {
    private tableName;
    private client: DocumentClient;
    private contract: Contract;

    constructor(contract: Contract) {
        if (process.env.AVATAR_TABLE == undefined) {
            throw new Error("avatar table is not set");
        }

        this.tableName = process.env.AVATAR_TABLE;
        this.client = client;
        this.contract = contract;
    }

    getTableName(): string {
        return this.tableName;
    }

    async enableReveal(): Promise<boolean> {
        const enable = await this.contract.revealed();
        return enable;
    }

    async isOwner(address: string, tokenId: number): Promise<boolean> {
        const owner = await this.contract.ownerOf(tokenId);
        return owner.toLowerCase() == address;
    }

    // get the soulboundId so that soulbound service
    // can find the corresponding blindbox type
    async getSoulboundIdById(avatarId: number): Promise<number> {
        const souldboundId = await this.contract.avatarToSoulbound(avatarId);
        return Number(souldboundId);
    }

    async updateAvatar(avatar: Avatar) {
        const params = {
            TableName: this.tableName,
            Key: {
                tokenId: avatar.tokenId,
            },
            UpdateExpression:
                "SET randomId = :randomId, isRevealed = :isRevealed",
            ExpressionAttributeValues: {
                ":randomId": avatar.randomId,
                ":isRevealed": avatar.isRevealed,
            },
        };

        await this.client.update(params).promise();
    }

    async getAvatarById(tokenId: number): Promise<Avatar> {
        const params = {
            TableName: this.tableName,
            Key: {
                tokenId: tokenId,
            },
        };

        const res = await this.client.get(params).promise();
        const avatar = res.Item as Avatar;

        return avatar;
    }

    // if randomId exists in database && isRevealed is true,
    // then the metadata is revealed
    async isRandomIdRevealed(randomId: number): Promise<boolean> {
        const params = {
            TableName: this.tableName,
            FilterExpression:
                "#randomId = :randomId and #isRevealed = :isRevealed",
            ExpressionAttributeNames: {
                "#randomId": "randomId",
                "#isRevealed": "isRevealed",
            }, // optional names substitution
            ExpressionAttributeValues: {
                ":randomId": randomId,
                ":isRevealed": true,
            },
            Select: "COUNT",
        };

        const res = await this.client.scan(params).promise();
        const count = res.Count;

        return count != 0;
    }
}
