import { Avatar, Reveal } from "../types";
import { Contract } from "ethers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { client } from "../database/DynamoDB";

export default class RevealService {
    private tableName;
    private client: DocumentClient;

    constructor() {
        if (process.env.REVEAL_TABLE == undefined) {
            throw new Error("reveal table is not set");
        }

        this.tableName = process.env.REVEAL_TABLE;
        this.client = client;
    }

    getTableName(): string {
        return this.tableName;
    }

    async getRealMetadataById(randomId: number): Promise<number> {
        const params = {
            TableName: this.tableName,
            Key: {
                randomId: randomId,
            },
        };

        const res = await this.client.get(params).promise();
        const reveal = res.Item as Reveal;

        return reveal.metadataId;
    }
}
