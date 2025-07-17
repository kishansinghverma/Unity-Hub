import { ObjectUtils, SplitwiseThrowable } from "../common/models";
import { ExecutionResponse, GroupExpenseRequest, GroupInfoRequest, SelfPaidExpense, SettlementExpense, SettlementExpenseRequest, SharedExpense } from "../common/types";
import { MongoDbService } from "../services/mongodb";
import { splitwiseService } from "../services/splitwise";
import { constants as globalConstants } from "../common/constants";

class Splitwise {
    private constants;
    private database: MongoDbService;
    private globalConstants = globalConstants.expense;

    constructor() {
        this.constants = {
            userId: {
                Self: 62039516,
                Kishan: 74792591,
                Uncle: 65793539,
                Papa: 65793540
            },
        };

        this.database = new MongoDbService(this.globalConstants.database);
    }

    private getGroupsSharing = async () => {
        const response = await this.database.getDocument(this.globalConstants.collection.meta, { name: 'Groups' }, {});
        return response;
    }

    public listCategories = splitwiseService.listCategories;

    public listGroups = async () => {
        const sharingStatusResponse = await this.getGroupsSharing();
        const splitwiseGroupsResponse = await splitwiseService.listGroups()

        if (ObjectUtils.isEmptyResponse(splitwiseGroupsResponse))
            return splitwiseGroupsResponse;

        if (ObjectUtils.isEmptyResponse(sharingStatusResponse)) {
            return {
                statusCode: splitwiseGroupsResponse.statusCode,
                content: splitwiseGroupsResponse.content.groups.map((group: any) => ({ ...group, sharing: false }))
            } as ExecutionResponse;
        }

        return {
            statusCode: splitwiseGroupsResponse.statusCode,
            content: splitwiseGroupsResponse.content.groups.map((group: any) => {
                const sharing = !!sharingStatusResponse.content[group.id];
                return { ...group, sharing };
            })
        } as ExecutionResponse;
    }

    public getGroupDetails = async (groupId: string) => {
        const splitwiseGroupResponse = await splitwiseService.getGroup(groupId);
        const sharingStatusResponse = await this.getGroupsSharing();

        if (ObjectUtils.isEmptyResponse(splitwiseGroupResponse))
            return splitwiseGroupResponse;

        if (ObjectUtils.isEmptyResponse(sharingStatusResponse)) {
            splitwiseGroupResponse.content = { ...splitwiseGroupResponse.content.group, sharing: false }
            return splitwiseGroupResponse;
        }

        const sharing = !!sharingStatusResponse.content[groupId];
        splitwiseGroupResponse.content = { ...splitwiseGroupResponse.content.group, sharing: sharing }
        return splitwiseGroupResponse;
    }

    public updateGroupInfo = async (groupInfo: GroupInfoRequest) => {
        const query = { name: 'Groups' };
        const patchData = { $set: { [groupInfo.id]: groupInfo.isShared } };
        return this.database.patchDocument(this.globalConstants.collection.meta, patchData, query, { upsert: true })
    }

    public settleExpenses = (transaction: SettlementExpenseRequest) => {
        const payerId = transaction.parties.find(id => id !== this.constants.userId.Self);
        if (!payerId) throw new SplitwiseThrowable('Payer party not available!', 400);

        const expense: SettlementExpense = {
            cost: transaction.cost,
            currency_code: 'INR',
            group_id: transaction.group_id,
            date: transaction.date,
            category_id: '18',
            payment: true,
            transaction_method: 'offline',
            creation_method: 'payment',
            settle_all: true,
            description: transaction.description,
            details: transaction.details,
            users__0__user_id: this.constants.userId.Self,
            users__0__paid_share: '0.00',
            users__0__owed_share: transaction.cost,
            users__1__user_id: payerId,
            users__1__paid_share: transaction.cost,
            users__1__owed_share: '0.00',
        }

        return splitwiseService.addExpense(expense);
    };

    public addExpense = (transaction: GroupExpenseRequest) => {
        if (transaction.shared) {
            const expense: SharedExpense = {
                date: transaction.date,
                cost: transaction.cost,
                description: transaction.description,
                details: transaction.details,
                group_id: transaction.group_id,
                split_equally: true
            }
            return splitwiseService.addExpense(expense);
        }
        else {
            const totalCost = parseInt(transaction.cost);
            const expense: SelfPaidExpense = {
                date: transaction.date,
                cost: Math.floor(totalCost).toString(),
                description: transaction.description, // expense title
                details: transaction.details, // expense comment
                group_id: transaction.group_id,
                users__0__user_id: this.constants.userId.Self,
                users__0__paid_share: Math.floor(totalCost).toString(),
                users__0__owed_share: "0"
            };

            const splitAmount = [...Array(transaction.parties.length - 1)].map((_, i) =>
                Math.floor(totalCost / (transaction.parties.length - 1)) + (i < totalCost % (transaction.parties.length - 1) ? 1 : 0));

            transaction.parties.filter(party => party !== this.constants.userId.Self).forEach((party, index) => {
                expense[`users__${index + 1}__user_id`] = party;
                expense[`users__${index + 1}__paid_share`] = '0.00';
                expense[`users__${index + 1}__owed_share`] = `${splitAmount[index]}`;
            });

            return splitwiseService.addExpense(expense);
        }
    };
}

export const splitwise = new Splitwise();