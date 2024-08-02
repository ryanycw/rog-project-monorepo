export const FIRST_TOKEN_ID = 0;
export const LAST_TOKEN_ID = 10;

export const FREE_MINT_ADDRESS = "0x998a1f5e800bF281094DA9710101bEaF3DEB0ae0";
export const AVATAR_ADDRESS = "0xaac1B7f3B7B7104d4e8169935D9e9e5AF747a962";

const POOL_SIZE = 15;
const LEGENDARY_POOL = {
    startIdx: BigInt(0),
    size: BigInt(POOL_SIZE),
};
const EPIC_POOL = {
    startIdx: BigInt(15),
    size: BigInt(POOL_SIZE),
};
const RARE_POOL = {
    startIdx: BigInt(30),
    size: BigInt(POOL_SIZE),
};
const COMMON_POOL = {
    startIdx: BigInt(45),
    size: BigInt(POOL_SIZE)
}

export const POOLS = [LEGENDARY_POOL, EPIC_POOL, RARE_POOL, COMMON_POOL];

export const VRF = BigInt(
    "54358093964092200195992964211992512825669242235183240952295200998486985634194",
);