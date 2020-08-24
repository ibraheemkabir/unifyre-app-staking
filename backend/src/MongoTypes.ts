import {ValidationUtils} from "ferrum-plumbing";
import { Schema, Connection, Document } from "mongoose";
import { StakeEvent, StakingApp, } from "./Types";

const StakingAppSchema: Schema = new Schema<StakingApp>({
    network: String,
    currency: String,
    symbol: String,
    contractAddress: String,
    name: String,
    tokenAddress: String,
    stakedBalance: String,
    rewardBalance: String,
    stakingCap: String,
    stakedTotal: String,
    totalReward: String,
    withdrawStarts: Number,
    withdrawEnds: Number,
    stakingStarts: Number,
    stakingEnds: Number,
});

const StakeEventSchema: Schema = new Schema<StakeEvent>({
  contractAddress: String,
  contractName: String,
  currency: String,
  symbol: String,
  userAddress: String,
  email: String,
  userId: String,
  amountStaked: String,
  approveTxIds: [String],
  stakeTxId: String,
  transactionStatus: String,
});

export const StakingAppModel = (c: Connection) => c.model<StakingApp&Document>('staking', StakingAppSchema);

export const StakeEventModel = (c: Connection) => c.model<StakeEvent&Document>('stakeEvent', StakeEventSchema);

export function getEnv(env: string) {
    const res = process.env[env];
    ValidationUtils.isTrue(!!res, `Make sure to set environment variable '${env}'`);
    return res!;
}