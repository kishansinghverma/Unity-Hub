import { GroupExpenseRequest, SelfPaidExpense, SharedExpense } from "../common/types";
import { splitwiseService } from "../services/splitwise";

class Splitwise {
    private constants;

    private groupOwner = new Map<number, number>();

    constructor() {
        this.constants = {
            "groups": {
                "familyExpenses": {
                    "id": 52168740,
                    "payerId": 65793539
                },
                "miscellaneous": {
                    "id": 52697237,
                    "payerId": 74792591
                },
                "self": {
                    "id": 52697298,
                    "payerId": 74792591
                },
                "prepaid Gatepass": {
                    "id": 52740365,
                    "payerId": 74841231
                }
            },
            "nonSharingGroups": [52168740, 52697237, 52697298, 52740365],
            "userId": {
                "self": 62039516
            }
        };
        Object.values(this.constants.groups).forEach(({ id, payerId }) => this.groupOwner.set(id, payerId));
    }

    public listGroups = () => splitwiseService.listGroups();

    public getGroupDetails = (groupId: string) => splitwiseService.getGroup(groupId);

    public addGenericExpense = (transaction: GroupExpenseRequest) => {
        if (this.constants.nonSharingGroups.includes(transaction.group_id)) {
            const expense: SelfPaidExpense = {
                ...transaction,
                users__0__user_id: this.constants.userId.self,
                users__0__paid_share: `${transaction.cost}`,
                users__0__owed_share: "0",
                users__1__user_id: this.groupOwner.get(transaction.group_id) ?? this.constants.userId.self,
                users__1__paid_share: "0",
                users__1__owed_share: `${transaction.cost}`
            };
            return splitwiseService.addExpense(expense);
        }
        else {
            const expenseData: SharedExpense = {
                ...transaction,
                split_equally: true
            }
            return splitwiseService.addExpense(expenseData);
        }
    };

    public addEmandiExpense = (transaction: GroupExpenseRequest) => {
        const expense = {
            ...transaction,
            group_id: this.constants.groups.familyExpenses.id
        }

        return splitwiseService.addExpense(expense);
    }
}

export const splitwise = new Splitwise();