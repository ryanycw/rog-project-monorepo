export enum POOL_TYPE {
    LEGENDARY,
    EPIC,
    RARE,
    COMMON,
}

export type Pool = {
    startIdx: bigint;
    size: bigint;
};
