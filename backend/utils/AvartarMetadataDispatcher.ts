import { Avatar, Metadata } from "../types";
import SoulboundService from "../services/SoulboundService";
import AvatarService from "../services/AvatarService";
import RevealService from "../services/RevealService";
import { META_IPFS_URL } from "../constants";

export async function getMetadataByToken(
    avatar: Avatar,
    avatarService: AvatarService,
    soulboundService: SoulboundService,
    revealService: RevealService,
): Promise<Metadata | never> {
    let metadata: Metadata;

    if (avatar.revealed == undefined) {
        // the nft is not revealed yet
        const soulboundId = await avatarService.getSoulboundIdById(
            avatar.tokenId,
        );
        metadata = await soulboundService.getMetadataById(soulboundId);
    } else {
        const metadataId = await revealService.getRealMetadataById(
            avatar.revealed,
        );
        // revealed metadata
        const res = await fetch(
            `ipfs gateway/${META_IPFS_URL}/${metadataId}.json`,
        );
        metadata = (await res.json()) as Metadata;
    }

    return metadata;
}
