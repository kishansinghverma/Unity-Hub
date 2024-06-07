import { GroupExpenseRequest, SelfPaidExpense, SharedExpense } from "../common/types";
import { splitwiseService } from "../services/splitwise";

class Splitwise {
    private constants;
    private payers: Map<number, number> = new Map();

    constructor() {
        this.constants = {
            groups: {
                Miscellaneous: {
                    id: 52697237,
                    payerId: 74792591
                },
                Self: {
                    id: 52697298,
                    payerId: 74792591
                },
                PapaJi: {
                    id: 66300166,
                    payerId: 65793540
                },
                Uncle: {
                    id: 66300207,
                    payerId: 65793539
                }
            },
            userId: {
                Self: 62039516,
                Kishan: 74792591,
                Uncle: 65793539,
                Papa: 65793540
            },
        };

        Object.values(this.constants.groups).forEach(group => this.payers.set(group.id, group.payerId));
    }

    public listGroups = () => splitwiseService.listGroups();

    public getGroupDetails = (groupId: string) => splitwiseService.getGroup(groupId);

    public addExpense = (transaction: GroupExpenseRequest) => {
        const forceSharing = !Object.values(this.constants.groups).map(value => (value.id)).includes(transaction.group_id);

        if (forceSharing || transaction.shared === 'true') {
            const expense: SharedExpense = {
                date: transaction.date,
                cost: transaction.cost,
                description: transaction.description,
                details: transaction.details,
                group_id: transaction.group_id,
                split_equally: true
            }
            return splitwiseService.addExpense(expense, transaction.debitFrom);
        }
        else {
            const expense: SelfPaidExpense = {
                date: transaction.date,
                cost: transaction.cost,
                description: transaction.description,
                details: transaction.details,
                group_id: transaction.group_id,
                users__0__user_id: this.constants.userId.Self,
                users__0__paid_share: `${transaction.cost}`,
                users__0__owed_share: "0",
                users__1__user_id: this.payers.get(transaction.group_id) as number,
                users__1__paid_share: "0",
                users__1__owed_share: `${transaction.cost}`
            };
            return splitwiseService.addExpense(expense, transaction.debitFrom);
        }
    };
}

export const splitwise = new Splitwise();