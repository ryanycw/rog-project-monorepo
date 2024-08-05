export enum POOL_TYPE {
    LEGENDARY,
    EPIC,
    RARE,
    COMMON,
}

export type Pool = {
    type: POOL_TYPE;
    startIdx: bigint;
    size: bigint;
};

export type PoolInfo = {
    startIdx: bigint;
    size: bigint;
};
